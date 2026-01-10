/**
 * Stripe Webhook Handler
 *
 * This endpoint receives webhook events from Stripe and processes subscription lifecycle events.
 *
 * Handled Events:
 * - checkout.session.completed: Customer completes checkout, creates subscription
 * - customer.subscription.created/updated: Subscription changes (upgrades, downgrades, renewals)
 * - customer.subscription.deleted: Subscription canceled
 * - invoice.payment_succeeded: Successful payment, creates payment record
 * - invoice.payment_failed: Failed payment, sends alert email
 *
 * Security:
 * - Webhook signature verification using STRIPE_WEBHOOK_SECRET
 * - Idempotency check to prevent duplicate processing
 *
 * Flow:
 * 1. Verify webhook signature
 * 2. Check if event already processed (idempotency)
 * 3. Log event to database for audit trail
 * 4. Process event based on type
 * 5. Mark event as processed
 * 6. Always return 200 to Stripe (prevents infinite retries)
 */

import { headers } from 'next/headers';
import { stripe, getCompetitorLimitFromPriceId } from '@/lib/stripe/config';
import { db } from '@/lib/db/prisma';
import { sendEmail } from '@/lib/email/send';
import Stripe from 'stripe';

export async function POST(req: Request) {
  const body = await req.text();
  const signature = headers().get('stripe-signature');

  if (!signature) {
    return Response.json({ error: 'No signature' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    // Verify webhook signature
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (error: any) {
    console.error('Webhook signature verification failed:', error.message);
    return Response.json({ error: 'Invalid signature' }, { status: 400 });
  }

  // Check if event was already processed (idempotency)
  const existingEvent = await db.webhookEvent.findFirst({
    where: {
      source: 'stripe',
      payload: {
        path: ['id'],
        equals: event.id,
      },
    },
  });

  if (existingEvent?.processed) {
    console.log('Event already processed:', event.id);
    return Response.json({ received: true, status: 'already_processed' });
  }

  // Log webhook event for debugging and audit trail
  let webhookEventId: number | null = null;
  try {
    const webhookEvent = await db.webhookEvent.create({
      data: {
        source: 'stripe',
        eventType: event.type,
        payload: event as any,
        processed: false,
      },
    });
    webhookEventId = webhookEvent.id;
  } catch (error) {
    console.error('Failed to log webhook event:', error);
  }

  // Process webhook event
  try {
    console.log('Processing Stripe webhook:', event.type, event.id);

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutComplete(session);
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdate(subscription);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionCanceled(subscription);
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentSuccess(invoice);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentFailed(invoice);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    // Mark webhook as processed
    if (webhookEventId) {
      await db.webhookEvent.update({
        where: { id: webhookEventId },
        data: {
          processed: true,
          processedAt: new Date(),
        },
      });
    }

    console.log('Successfully processed webhook:', event.type, event.id);
    return Response.json({ received: true });
  } catch (error: any) {
    console.error('Error processing webhook:', error);
    console.error('Stack trace:', error.stack);

    // Log error but still return 200 to Stripe (prevents retries for permanent errors)
    if (webhookEventId) {
      await db.webhookEvent.update({
        where: { id: webhookEventId },
        data: {
          error: error.message,
          processedAt: new Date(),
        },
      });
    }

    return Response.json({ received: true, error: error.message });
  }
}

async function handleCheckoutComplete(session: Stripe.Checkout.Session) {
  const customerId = session.customer as string;
  const subscriptionId = session.subscription as string;

  if (!customerId || !subscriptionId) {
    console.error('Missing customer or subscription in checkout session:', session.id);
    return;
  }

  // Find user by email (from session metadata or customer)
  const userId = session.metadata?.userId;

  if (userId) {
    // Update user with Stripe customer ID if not already set
    await db.user.update({
      where: { id: parseInt(userId) },
      data: { stripeCustomerId: customerId },
    });
  } else {
    // Fallback: find user by customer email
    const customer = await stripe.customers.retrieve(customerId) as Stripe.Customer;
    if (customer.email) {
      await db.user.update({
        where: { email: customer.email },
        data: { stripeCustomerId: customerId },
      });
    }
  }

  // Now handle the subscription
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  await handleSubscriptionUpdate(subscription);
}

async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;

  // Find user by Stripe customer ID
  const user = await db.user.findUnique({
    where: { stripeCustomerId: customerId },
  });

  if (!user) {
    console.error('User not found for Stripe customer:', customerId);
    return;
  }

  // Get price ID from subscription items
  if (!subscription.items.data || subscription.items.data.length === 0) {
    console.error('No subscription items found:', subscription.id);
    return;
  }

  const priceId = subscription.items.data[0].price.id;
  const competitorLimit = getCompetitorLimitFromPriceId(priceId);

  console.log('Updating subscription:', {
    subscriptionId: subscription.id,
    userId: user.id,
    status: subscription.status,
    priceId,
    competitorLimit,
  });

  // Delete trial subscription if it exists (user is upgrading from trial)
  const trialSubscription = await db.subscription.findFirst({
    where: {
      userId: user.id,
      stripePriceId: 'trial',
    },
  });

  if (trialSubscription) {
    console.log('Deleting trial subscription for user:', user.id);
    await db.subscription.delete({
      where: { id: trialSubscription.id },
    });
  }

  // Upsert subscription
  await db.subscription.upsert({
    where: { stripeSubscriptionId: subscription.id },
    create: {
      userId: user.id,
      stripeSubscriptionId: subscription.id,
      stripePriceId: priceId,
      status: subscription.status,
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      competitorLimit,
    },
    update: {
      stripePriceId: priceId,
      status: subscription.status,
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      competitorLimit,
      updatedAt: new Date(),
    },
  });

  console.log('Subscription updated successfully:', subscription.id);
}

async function handleSubscriptionCanceled(subscription: Stripe.Subscription) {
  await db.subscription.update({
    where: { stripeSubscriptionId: subscription.id },
    data: {
      status: 'canceled',
      updatedAt: new Date(),
    },
  });
}

async function handlePaymentSuccess(invoice: Stripe.Invoice) {
  if (!invoice.customer || !invoice.payment_intent) {
    console.log('Skipping payment success - missing customer or payment intent');
    return;
  }

  const customerId = invoice.customer as string;
  const paymentIntentId = invoice.payment_intent as string;

  const user = await db.user.findUnique({
    where: { stripeCustomerId: customerId },
  });

  if (!user) {
    console.error('User not found for Stripe customer:', customerId);
    return;
  }

  // Create or update payment record (use upsert to handle retries)
  await db.payment.upsert({
    where: { stripePaymentIntentId: paymentIntentId },
    create: {
      userId: user.id,
      stripePaymentIntentId: paymentIntentId,
      amount: invoice.amount_paid,
      currency: invoice.currency,
      status: 'succeeded',
    },
    update: {
      amount: invoice.amount_paid,
      status: 'succeeded',
    },
  });

  // If subscription exists and was past_due, reactivate it
  if (invoice.subscription) {
    const subscription = await db.subscription.findUnique({
      where: { stripeSubscriptionId: invoice.subscription as string },
    });

    if (subscription && subscription.status === 'past_due') {
      await db.subscription.update({
        where: { stripeSubscriptionId: invoice.subscription as string },
        data: {
          status: 'active',
          updatedAt: new Date(),
        },
      });

      // Send reactivation email
      try {
        await sendEmail({
          to: user.email,
          subject: 'Payment Successful - Subscription Reactivated',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #16a34a;">Payment Successful</h2>
              <p>Hi ${user.name || 'there'},</p>
              <p>Your payment has been processed successfully and your subscription is now active.</p>
              <p>Thank you for continuing to use CompetitorWatch!</p>
              <p style="margin: 30px 0;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                  Go to Dashboard
                </a>
              </p>
            </div>
          `,
        });
      } catch (emailError) {
        console.error('Failed to send reactivation email:', emailError);
      }
    }
  }
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  if (!invoice.customer) {
    return;
  }

  const customerId = invoice.customer as string;

  const user = await db.user.findUnique({
    where: { stripeCustomerId: customerId },
    select: { id: true, email: true, name: true },
  });

  if (!user) {
    console.error('User not found for failed payment:', customerId);
    return;
  }

  // Update subscription status to past_due
  if (invoice.subscription) {
    await db.subscription.update({
      where: { stripeSubscriptionId: invoice.subscription as string },
      data: {
        status: 'past_due',
        updatedAt: new Date(),
      },
    });
  }

  // Send payment failure notification email
  try {
    const amountDue = (invoice.amount_due / 100).toFixed(2);
    const invoiceUrl = invoice.hosted_invoice_url || `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing`;

    await sendEmail({
      to: user.email,
      subject: 'Payment Failed - Action Required',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #dc2626;">Payment Failed</h2>
          <p>Hi ${user.name || 'there'},</p>
          <p>We were unable to process your payment of <strong>$${amountDue}</strong>.</p>
          <p>Your subscription is now in a past due status. Please update your payment method to continue using CompetitorWatch.</p>
          <p style="margin: 30px 0;">
            <a href="${invoiceUrl}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Update Payment Method
            </a>
          </p>
          <p style="color: #6b7280; font-size: 14px;">
            If you have any questions, please contact our support team.
          </p>
        </div>
      `,
    });
  } catch (emailError) {
    console.error('Failed to send payment failure email:', emailError);
    // Don't throw - we still want to process the webhook
  }
}

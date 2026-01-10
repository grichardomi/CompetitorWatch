import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { db } from '@/lib/db/prisma';
import { stripe, getPriceId, PRICING_PLANS } from '@/lib/stripe/config';

export async function POST(req: Request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user from database
    const user = await db.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    // Parse request body
    const body = await req.json();
    const { plan, billingCycle = 'monthly' } = body;

    // Validate plan
    if (!plan || !(plan in PRICING_PLANS)) {
      return Response.json(
        { error: 'Invalid plan. Must be: starter, professional, or enterprise' },
        { status: 400 }
      );
    }

    // Validate billing cycle
    if (billingCycle !== 'monthly' && billingCycle !== 'annual') {
      return Response.json(
        { error: 'Invalid billing cycle. Must be: monthly or annual' },
        { status: 400 }
      );
    }

    // Starter plan doesn't have annual option
    if (plan === 'starter' && billingCycle === 'annual') {
      return Response.json(
        { error: 'Starter plan only available as monthly subscription' },
        { status: 400 }
      );
    }

    // Get price ID for the plan and billing cycle
    const priceId = getPriceId(plan as keyof typeof PRICING_PLANS, billingCycle);

    if (!priceId) {
      return Response.json(
        { error: 'Price ID not configured for this plan' },
        { status: 500 }
      );
    }

    // Get or create Stripe customer
    let customerId = user.stripeCustomerId;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email!,
        name: user.name || undefined,
        metadata: {
          userId: user.id.toString(),
        },
      });

      customerId = customer.id;

      // Update user with Stripe customer ID
      await db.user.update({
        where: { id: user.id },
        data: { stripeCustomerId: customerId },
      });
    }

    // Create Stripe checkout session
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing?canceled=true`,
      allow_promotion_codes: true,
      metadata: {
        userId: user.id.toString(),
        plan,
        billingCycle,
      },
      subscription_data: {
        metadata: {
          userId: user.id.toString(),
          plan,
        },
      },
    });

    return Response.json({
      checkoutUrl: checkoutSession.url,
      sessionId: checkoutSession.id,
    });
  } catch (error: any) {
    console.error('Failed to create checkout session:', error);
    return Response.json(
      { error: error.message || 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/prisma';
import { sendEmail } from '@/lib/email/client';
import { renderEmailTemplate, generateSubject } from '@/lib/email/render';

const CRON_SECRET = process.env.CRON_SECRET;

/**
 * Trial Expiration Cron Job
 * GET /api/cron/expire-trials
 *
 * Runs every hour to:
 * 1. Find trials that have ended (currentPeriodEnd < now)
 * 2. Update their status from 'trialing' to 'expired'
 * 3. Optionally send reactivation emails
 *
 * Protected by CRON_SECRET header.
 * Should be called every hour via cron job.
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();

  // Verify cron secret
  const cronSecret = request.headers.get('Authorization')?.replace('Bearer ', '');
  if (!CRON_SECRET || cronSecret !== CRON_SECRET) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const now = new Date();

    // Find all expired trials (local trials only, not Stripe-managed)
    const expiredTrials = await db.subscription.findMany({
      where: {
        status: 'trialing',
        stripePriceId: 'trial', // Only local trials
        currentPeriodEnd: {
          lt: now, // Trial end date is in the past
        },
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });

    console.log(`Found ${expiredTrials.length} expired trials to process`);

    let expired = 0;
    let emailsSent = 0;
    let errors = 0;
    const errorMessages: string[] = [];

    // Process each expired trial
    for (const trial of expiredTrials) {
      try {
        // Update subscription status to expired
        await db.subscription.update({
          where: { id: trial.id },
          data: {
            status: 'expired',
          },
        });

        expired++;
        console.log(`Expired trial for user ${trial.userId} (${trial.user.email})`);

        // Send reactivation email (optional - only if we haven't sent trial_ended email yet)
        // Check if trial_ended email was already sent
        const trialEndedEmailSent = await db.emailQueue.findFirst({
          where: {
            userId: trial.userId,
            templateName: 'trial_ended',
            status: 'sent',
          },
        });

        if (!trialEndedEmailSent) {
          // Schedule immediate trial_ended email
          const emailResult = await renderEmailTemplate({
            templateName: 'trial_ended',
            templateData: {
              userName: trial.user.name || 'there',
              dashboardUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
            },
          });

          if (emailResult.success && emailResult.html) {
            await sendEmail({
              to: trial.user.email!,
              subject: generateSubject('trial_ended'),
              html: emailResult.html,
            });

            emailsSent++;
            console.log(`Sent trial_ended email to ${trial.user.email}`);
          }
        }
      } catch (error) {
        errors++;
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        errorMessages.push(`User ${trial.userId}: ${errorMsg}`);
        console.error(`Failed to expire trial for user ${trial.userId}:`, error);
      }
    }

    const elapsed = Date.now() - startTime;
    const message = `Expired ${expired} trials, sent ${emailsSent} emails, ${errors} errors`;

    console.log(message);

    return NextResponse.json(
      {
        status: 'success',
        message,
        timestamp: now.toISOString(),
        stats: {
          found: expiredTrials.length,
          expired,
          emailsSent,
          errors,
        },
        errorMessages: errors > 0 ? errorMessages : undefined,
        elapsedMs: elapsed,
      },
      { status: 200 }
    );
  } catch (error) {
    const elapsed = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    console.error('Trial expiration cron error:', error);

    return NextResponse.json(
      {
        status: 'error',
        error: errorMessage,
        timestamp: new Date().toISOString(),
        elapsedMs: elapsed,
      },
      { status: 500 }
    );
  }
}

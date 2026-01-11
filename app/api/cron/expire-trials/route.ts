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
 * 1. Find trials that have ended (currentPeriodEnd < now) → Move to 'grace_period'
 * 2. Find grace periods that have ended (3 days after trial end) → Move to 'expired'
 * 3. Send appropriate notification emails
 *
 * Grace Period: 3 days of read-only access after trial ends
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
    const gracePeriodDays = 3;

    // STEP 1: Transition trials to grace period
    // Find trials that have ended (local trials only, not Stripe-managed)
    const endedTrials = await db.subscription.findMany({
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

    console.log(`Found ${endedTrials.length} ended trials to move to grace period`);

    let movedToGrace = 0;
    let gracePeriodEmailsSent = 0;

    for (const trial of endedTrials) {
      try {
        // Update subscription status to grace_period
        await db.subscription.update({
          where: { id: trial.id },
          data: {
            status: 'grace_period',
          },
        });

        movedToGrace++;
        console.log(`Moved trial to grace period for user ${trial.userId} (${trial.user.email})`);

        // Send trial_ended email with grace period information
        const trialEndedEmailSent = await db.emailQueue.findFirst({
          where: {
            userId: trial.userId,
            templateName: 'trial_ended',
            status: 'sent',
          },
        });

        if (!trialEndedEmailSent) {
          const emailResult = await renderEmailTemplate({
            templateName: 'trial_ended',
            templateData: {
              userName: trial.user.name || 'there',
              dashboardUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
              gracePeriodDays,
            },
          });

          if (emailResult.success && emailResult.html) {
            await sendEmail({
              to: trial.user.email!,
              subject: generateSubject('trial_ended'),
              html: emailResult.html,
            });

            gracePeriodEmailsSent++;
            console.log(`Sent trial_ended email to ${trial.user.email}`);
          }
        }
      } catch (error) {
        console.error(`Failed to move trial to grace period for user ${trial.userId}:`, error);
      }
    }

    // STEP 2: Expire grace periods
    // Calculate grace period end (trial end + 3 days)
    const gracePeriodEndDate = new Date(now);
    gracePeriodEndDate.setDate(gracePeriodEndDate.getDate() - gracePeriodDays);

    const expiredGracePeriods = await db.subscription.findMany({
      where: {
        status: 'grace_period',
        stripePriceId: 'trial',
        currentPeriodEnd: {
          lt: gracePeriodEndDate, // Grace period ended 3 days ago
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

    console.log(`Found ${expiredGracePeriods.length} grace periods to expire`);

    let expired = 0;
    let errors = 0;
    const errorMessages: string[] = [];

    let expiredEmailsSent = 0;

    for (const gracePeriod of expiredGracePeriods) {
      try {
        // Update subscription status to expired
        await db.subscription.update({
          where: { id: gracePeriod.id },
          data: {
            status: 'expired',
          },
        });

        expired++;
        console.log(`Expired grace period for user ${gracePeriod.userId} (${gracePeriod.user.email})`);

        // Send grace_period_ended email
        const gracePeriodEndedEmailSent = await db.emailQueue.findFirst({
          where: {
            userId: gracePeriod.userId,
            templateName: 'grace_period_ended',
            status: 'sent',
          },
        });

        if (!gracePeriodEndedEmailSent) {
          const emailResult = await renderEmailTemplate({
            templateName: 'grace_period_ended',
            templateData: {
              userName: gracePeriod.user.name || 'there',
              dashboardUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
            },
          });

          if (emailResult.success && emailResult.html) {
            await sendEmail({
              to: gracePeriod.user.email!,
              subject: generateSubject('grace_period_ended'),
              html: emailResult.html,
            });

            expiredEmailsSent++;
            console.log(`Sent grace_period_ended email to ${gracePeriod.user.email}`);
          }
        }
      } catch (error) {
        errors++;
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        errorMessages.push(`User ${gracePeriod.userId}: ${errorMsg}`);
        console.error(`Failed to expire grace period for user ${gracePeriod.userId}:`, error);
      }
    }

    const elapsed = Date.now() - startTime;
    const totalEmailsSent = gracePeriodEmailsSent + expiredEmailsSent;
    const message = `Moved ${movedToGrace} to grace period, expired ${expired} grace periods, sent ${totalEmailsSent} emails, ${errors} errors`;

    console.log(message);

    return NextResponse.json(
      {
        status: 'success',
        message,
        timestamp: now.toISOString(),
        stats: {
          endedTrials: endedTrials.length,
          movedToGrace,
          gracePeriodEmailsSent,
          expiredGracePeriods: expiredGracePeriods.length,
          expired,
          expiredEmailsSent,
          totalEmailsSent,
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

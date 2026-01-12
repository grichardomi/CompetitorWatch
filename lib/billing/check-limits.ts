import { db } from '@/lib/db/prisma';

/**
 * Check if user has reached their competitor limit
 */
export async function checkCompetitorLimit(userId: number) {
  const subscription = await db.subscription.findFirst({
    where: { userId },
  });

  if (!subscription) {
    throw new Error('No subscription found');
  }

  const competitorCount = await db.competitor.count({
    where: {
      Business: {
        userId,
      },
    },
  });

  if (competitorCount >= subscription.competitorLimit) {
    return {
      allowed: false,
      message: `You have reached your competitor limit of ${subscription.competitorLimit}. Upgrade your plan to add more competitors.`,
      limit: subscription.competitorLimit,
      current: competitorCount,
    };
  }

  return {
    allowed: true,
    limit: subscription.competitorLimit,
    current: competitorCount,
    remaining: subscription.competitorLimit - competitorCount,
  };
}

/**
 * Get subscription details for a user
 */
export async function getSubscriptionStatus(userId: number) {
  const subscription = await db.subscription.findFirst({
    where: { userId },
  });

  if (!subscription) {
    return null;
  }

  const competitorCount = await db.competitor.count({
    where: {
      Business: {
        userId,
      },
    },
  });

  return {
    status: subscription.status,
    plan: getPlanFromLimit(subscription.competitorLimit),
    competitorLimit: subscription.competitorLimit,
    competitorsUsed: competitorCount,
    currentPeriodEnd: subscription.currentPeriodEnd,
    cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
    trialEnds: subscription.status === 'trialing' ? subscription.currentPeriodEnd : null,
  };
}

/**
 * Determine plan name from competitor limit
 */
function getPlanFromLimit(limit: number): string {
  if (limit === 5) return 'Starter';
  if (limit === 20) return 'Pro';
  if (limit === 100) return 'Enterprise';
  return 'Unknown';
}

/**
 * Check if user is in trial period
 */
export async function isUserInTrial(userId: number): Promise<boolean> {
  const subscription = await db.subscription.findFirst({
    where: { userId },
  });

  if (!subscription) return false;
  return subscription.status === 'trialing';
}

/**
 * Get trial end date
 */
export async function getTrialEndDate(userId: number): Promise<Date | null> {
  const subscription = await db.subscription.findFirst({
    where: { userId },
  });

  if (!subscription || subscription.status !== 'trialing') {
    return null;
  }

  return subscription.currentPeriodEnd;
}

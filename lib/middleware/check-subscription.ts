import { db } from '@/lib/db/prisma';

export interface SubscriptionValidationResult {
  valid: boolean;
  subscription?: any;
  error?: string;
  errorCode?: 'NO_SUBSCRIPTION' | 'TRIAL_EXPIRED' | 'SUBSCRIPTION_INACTIVE' | 'SUBSCRIPTION_CANCELED';
}

/**
 * Validate that a user has an active subscription
 * Checks for:
 * - Subscription exists
 * - Trial is not expired
 * - Subscription is in active status ('trialing' or 'active')
 */
export async function requireActiveSubscription(
  userId: number
): Promise<SubscriptionValidationResult> {
  try {
    // Get user's most recent subscription
    const subscription = await db.subscription.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    if (!subscription) {
      return {
        valid: false,
        error: 'No subscription found. Please upgrade to continue.',
        errorCode: 'NO_SUBSCRIPTION',
      };
    }

    // Check if trial has expired
    if (subscription.status === 'trialing') {
      const now = new Date();
      const trialEnd = new Date(subscription.currentPeriodEnd);

      if (now > trialEnd) {
        return {
          valid: false,
          subscription,
          error: 'Your free trial has ended. Please upgrade to continue monitoring competitors.',
          errorCode: 'TRIAL_EXPIRED',
        };
      }
    }

    // Check if subscription is in an active state
    const activeStatuses = ['trialing', 'active'];
    if (!activeStatuses.includes(subscription.status)) {
      // Handle different inactive states
      if (subscription.status === 'canceled') {
        return {
          valid: false,
          subscription,
          error: 'Your subscription has been canceled. Please reactivate to continue.',
          errorCode: 'SUBSCRIPTION_CANCELED',
        };
      }

      if (subscription.status === 'past_due') {
        return {
          valid: false,
          subscription,
          error: 'Your payment is past due. Please update your payment method to continue.',
          errorCode: 'SUBSCRIPTION_INACTIVE',
        };
      }

      if (subscription.status === 'expired') {
        return {
          valid: false,
          subscription,
          error: 'Your subscription has expired. Please renew to continue.',
          errorCode: 'SUBSCRIPTION_INACTIVE',
        };
      }

      return {
        valid: false,
        subscription,
        error: 'Your subscription is not active. Please contact support.',
        errorCode: 'SUBSCRIPTION_INACTIVE',
      };
    }

    // Subscription is valid
    return {
      valid: true,
      subscription,
    };
  } catch (error) {
    console.error('Error validating subscription:', error);
    throw error;
  }
}

/**
 * Check if user can add more competitors
 * Validates:
 * - Subscription is active
 * - User hasn't reached competitor limit
 */
export async function canAddCompetitor(userId: number): Promise<{
  allowed: boolean;
  error?: string;
  limit?: number;
  current?: number;
  remaining?: number;
}> {
  // First check if subscription is active
  const subValidation = await requireActiveSubscription(userId);

  if (!subValidation.valid) {
    return {
      allowed: false,
      error: subValidation.error,
    };
  }

  const subscription = subValidation.subscription;

  // Get current competitor count
  const competitorCount = await db.competitor.count({
    where: {
      business: {
        userId,
      },
    },
  });

  // Check if limit reached
  if (competitorCount >= subscription.competitorLimit) {
    return {
      allowed: false,
      error: `You have reached your competitor limit of ${subscription.competitorLimit}. Upgrade your plan to add more competitors.`,
      limit: subscription.competitorLimit,
      current: competitorCount,
      remaining: 0,
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
 * Get subscription status with validation
 */
export async function getSubscriptionWithValidation(userId: number) {
  const validation = await requireActiveSubscription(userId);

  if (!validation.valid) {
    return {
      isActive: false,
      error: validation.error,
      errorCode: validation.errorCode,
    };
  }

  const subscription = validation.subscription;
  const now = new Date();
  const trialEnd = new Date(subscription.currentPeriodEnd);

  // Calculate days remaining for trials
  let daysRemaining = null;
  if (subscription.status === 'trialing') {
    daysRemaining = Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  }

  return {
    isActive: true,
    subscription: {
      id: subscription.id,
      status: subscription.status,
      stripePriceId: subscription.stripePriceId,
      competitorLimit: subscription.competitorLimit,
      currentPeriodStart: subscription.currentPeriodStart,
      currentPeriodEnd: subscription.currentPeriodEnd,
      cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
      daysRemaining,
    },
  };
}

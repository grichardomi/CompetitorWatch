import { checkAdminAccess } from '@/lib/auth/check-admin';
import { db } from '@/lib/db/prisma';

export async function GET() {
  try {
    // Check admin access
    const { authorized } = await checkAdminAccess();
    if (!authorized) {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Get active subscriptions for MRR calculation
    const activeSubscriptions = await db.subscription.findMany({
      where: {
        status: 'active',
        stripePriceId: { not: 'trial' },
      },
      select: {
        stripePriceId: true,
      },
    });

    // Calculate MRR (Monthly Recurring Revenue)
    let mrr = 0;
    const planRevenue = {
      starter: 0,
      professional: 0,
      enterprise: 0,
    };

    activeSubscriptions.forEach(sub => {
      let monthlyAmount = 0;

      if (sub.stripePriceId.includes('starter')) {
        monthlyAmount = 4900; // $49
        planRevenue.starter += monthlyAmount;
      } else if (sub.stripePriceId.includes('pro')) {
        if (sub.stripePriceId.includes('annual')) {
          monthlyAmount = 7900; // $79/month (annual)
        } else {
          monthlyAmount = 9900; // $99/month
        }
        planRevenue.professional += monthlyAmount;
      } else if (sub.stripePriceId.includes('enterprise')) {
        if (sub.stripePriceId.includes('annual')) {
          monthlyAmount = 24900; // $249/month (annual)
        } else {
          monthlyAmount = 29900; // $299/month
        }
        planRevenue.enterprise += monthlyAmount;
      }

      mrr += monthlyAmount;
    });

    // Get subscription counts by status
    const [activeCount, trialingCount, pastDueCount, canceledCount] = await Promise.all([
      db.subscription.count({ where: { status: 'active' } }),
      db.subscription.count({ where: { status: 'trialing' } }),
      db.subscription.count({ where: { status: 'past_due' } }),
      db.subscription.count({ where: { status: 'canceled' } }),
    ]);

    // Get trial conversion rate (users who went from trial to paid)
    const totalTrialUsers = await db.subscription.count({
      where: { stripePriceId: 'trial' },
    });

    const convertedUsers = await db.user.count({
      where: {
        Subscription: {
          some: {
            AND: [
              { status: 'active' },
              { stripePriceId: { not: 'trial' } },
            ],
          },
        },
      },
    });

    const conversionRate = totalTrialUsers > 0
      ? ((convertedUsers / totalTrialUsers) * 100).toFixed(1)
      : '0';

    // Get total revenue (all successful payments)
    const totalRevenue = await db.payment.aggregate({
      where: { status: 'succeeded' },
      _sum: { amount: true },
    });

    // Get revenue trend (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentRevenue = await db.payment.aggregate({
      where: {
        status: 'succeeded',
        createdAt: { gte: thirtyDaysAgo },
      },
      _sum: { amount: true },
    });

    // Calculate churn (canceled in last 30 days / active at start of period)
    const recentCancellations = await db.subscription.count({
      where: {
        status: 'canceled',
        updatedAt: { gte: thirtyDaysAgo },
      },
    });

    const churnRate = activeCount > 0
      ? ((recentCancellations / (activeCount + recentCancellations)) * 100).toFixed(1)
      : '0';

    return Response.json({
      mrr: mrr / 100, // Convert cents to dollars
      totalRevenue: (totalRevenue._sum.amount || 0) / 100,
      recentRevenue: (recentRevenue._sum.amount || 0) / 100,
      subscriptionCounts: {
        active: activeCount,
        trialing: trialingCount,
        pastDue: pastDueCount,
        canceled: canceledCount,
      },
      conversionRate: parseFloat(conversionRate),
      churnRate: parseFloat(churnRate),
      revenueByPlan: {
        starter: planRevenue.starter / 100,
        professional: planRevenue.professional / 100,
        enterprise: planRevenue.enterprise / 100,
      },
    });
  } catch (error) {
    console.error('Admin metrics error:', error);
    return Response.json(
      { error: 'Failed to fetch metrics' },
      { status: 500 }
    );
  }
}

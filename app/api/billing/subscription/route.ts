import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { db } from '@/lib/db/prisma';

export async function GET() {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user from database
    const user = await db.user.findUnique({
      where: { email: session.user.email },
      include: {
        Subscription: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!user) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    const subscription = user.Subscription[0];

    if (!subscription) {
      return Response.json({
        hasSubscription: false,
        message: 'No subscription found',
      });
    }

    // Calculate days remaining for trial
    let daysRemaining = null;
    if (subscription.status === 'trialing') {
      const now = new Date();
      const trialEnd = new Date(subscription.currentPeriodEnd);
      daysRemaining = Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    }

    // Get competitor usage
    const competitorCount = await db.competitor.count({
      where: {
        Business: {
          userId: user.id,
        },
      },
    });

    return Response.json({
      hasSubscription: true,
      subscription: {
        status: subscription.status,
        stripePriceId: subscription.stripePriceId,
        competitorLimit: subscription.competitorLimit,
        competitorsUsed: competitorCount,
        currentPeriodStart: subscription.currentPeriodStart,
        currentPeriodEnd: subscription.currentPeriodEnd,
        cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
        daysRemaining,
      },
    });
  } catch (error) {
    console.error('Failed to fetch subscription:', error);
    return Response.json(
      { error: 'Failed to fetch subscription' },
      { status: 500 }
    );
  }
}

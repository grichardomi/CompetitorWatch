import { checkAdminAccess } from '@/lib/auth/check-admin';
import { db } from '@/lib/db/prisma';

export async function GET(request: Request) {
  try {
    // Check admin access
    const { authorized } = await checkAdminAccess();
    if (!authorized) {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const plan = searchParams.get('plan') || 'all';
    const status = searchParams.get('status') || 'all';
    const search = searchParams.get('search') || '';

    // Build where clause
    const where: any = {};

    if (status !== 'all') {
      where.status = status;
    }

    if (plan !== 'all') {
      // Filter by plan based on stripePriceId
      if (plan === 'starter') {
        where.stripePriceId = { contains: 'starter' };
      } else if (plan === 'professional') {
        where.stripePriceId = { contains: 'pro' };
      } else if (plan === 'enterprise') {
        where.stripePriceId = { contains: 'enterprise' };
      } else if (plan === 'trial') {
        where.stripePriceId = 'trial';
      }
    }

    // Get all subscriptions with user details
    const subscriptions = await db.subscription.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        User: {
          select: {
            id: true,
            email: true,
            name: true,
            stripeCustomerId: true,
          },
        },
      },
    });

    // Filter by search (email or name)
    let filteredSubscriptions = subscriptions;
    if (search) {
      filteredSubscriptions = subscriptions.filter(sub =>
        sub.User.email.toLowerCase().includes(search.toLowerCase()) ||
        sub.User.name?.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Format response with plan names
    const formattedSubscriptions = filteredSubscriptions.map(sub => {
      let planName = 'Unknown';
      if (sub.stripePriceId === 'trial') {
        planName = 'Trial';
      } else if (sub.stripePriceId.includes('starter')) {
        planName = 'Starter';
      } else if (sub.stripePriceId.includes('pro')) {
        planName = sub.stripePriceId.includes('annual') ? 'Professional (Annual)' : 'Professional';
      } else if (sub.stripePriceId.includes('enterprise')) {
        planName = sub.stripePriceId.includes('annual') ? 'Enterprise (Annual)' : 'Enterprise';
      }

      return {
        id: sub.id,
        userId: sub.userId,
        user: sub.User,
        stripeSubscriptionId: sub.stripeSubscriptionId,
        stripePriceId: sub.stripePriceId,
        planName,
        status: sub.status,
        competitorLimit: sub.competitorLimit,
        currentPeriodStart: sub.currentPeriodStart,
        currentPeriodEnd: sub.currentPeriodEnd,
        cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
        createdAt: sub.createdAt,
        updatedAt: sub.updatedAt,
      };
    });

    return Response.json({
      subscriptions: formattedSubscriptions,
      total: formattedSubscriptions.length,
    });
  } catch (error) {
    console.error('Admin subscriptions error:', error);
    return Response.json(
      { error: 'Failed to fetch subscriptions' },
      { status: 500 }
    );
  }
}

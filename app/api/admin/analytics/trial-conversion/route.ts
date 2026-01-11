import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { db } from '@/lib/db/prisma';

/**
 * GET /api/admin/analytics/trial-conversion
 * Get trial conversion analytics
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const user = await db.user.findUnique({
      where: { email: session.user.email },
    });

    if (user?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30');

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get all trial subscriptions created in the time period
    const allTrials = await db.subscription.findMany({
      where: {
        stripePriceId: 'trial',
        createdAt: {
          gte: startDate,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            createdAt: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Get paid subscriptions for users who had trials
    const userIds = allTrials.map((t) => t.userId);
    const paidSubscriptions = await db.subscription.findMany({
      where: {
        userId: { in: userIds },
        stripePriceId: { not: 'trial' },
        status: { in: ['active', 'trialing'] },
      },
    });

    // Calculate conversion metrics
    const totalTrials = allTrials.length;
    const convertedTrials = new Set(paidSubscriptions.map((s) => s.userId)).size;
    const conversionRate = totalTrials > 0 ? (convertedTrials / totalTrials) * 100 : 0;

    // Calculate status breakdown
    const statusBreakdown = {
      trialing: allTrials.filter((t) => t.status === 'trialing').length,
      grace_period: allTrials.filter((t) => t.status === 'grace_period').length,
      expired: allTrials.filter((t) => t.status === 'expired').length,
      converted: convertedTrials,
    };

    // Calculate time to conversion
    const conversions = paidSubscriptions.map((paid) => {
      const trial = allTrials.find((t) => t.userId === paid.userId);
      if (!trial) return null;

      const trialStart = new Date(trial.createdAt);
      const conversionDate = new Date(paid.createdAt);
      const daysToConvert = Math.ceil(
        (conversionDate.getTime() - trialStart.getTime()) / (1000 * 60 * 60 * 24)
      );

      return {
        userId: paid.userId,
        userEmail: trial.user.email,
        trialStart: trialStart.toISOString(),
        convertedAt: conversionDate.toISOString(),
        daysToConvert,
        plan: paid.stripePriceId,
      };
    }).filter(Boolean);

    const avgDaysToConvert = conversions.length > 0
      ? conversions.reduce((sum, c) => sum + (c?.daysToConvert || 0), 0) / conversions.length
      : 0;

    // Get conversion funnel stats
    const now = new Date();
    const trialsExpiringSoon = allTrials.filter((t) => {
      if (t.status !== 'trialing') return false;
      const daysRemaining = Math.ceil(
        (new Date(t.currentPeriodEnd).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );
      return daysRemaining <= 3 && daysRemaining > 0;
    }).length;

    // Recent conversions (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentConversions = conversions.filter((c) =>
      c && new Date(c.convertedAt) >= sevenDaysAgo
    );

    return NextResponse.json({
      period: `Last ${days} days`,
      overview: {
        totalTrials,
        convertedTrials,
        conversionRate: parseFloat(conversionRate.toFixed(2)),
        avgDaysToConvert: parseFloat(avgDaysToConvert.toFixed(1)),
        trialsExpiringSoon,
      },
      statusBreakdown,
      conversions: conversions.slice(0, 20), // Last 20 conversions
      recentConversions: recentConversions.length,
    });
  } catch (error) {
    console.error('Failed to fetch trial conversion analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { db } from '@/lib/db/prisma';

/**
 * GET /api/admin/trials
 * Get all trial subscriptions with filtering
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

    if (!user?.isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get('status');

    // Build where clause
    const where: any = {
      stripePriceId: 'trial',
    };

    if (statusFilter && statusFilter !== 'all') {
      if (statusFilter === 'active') {
        where.status = 'trialing';
      } else {
        where.status = statusFilter;
      }
    }

    // Fetch trials with user information
    const trials = await db.subscription.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            createdAt: true,
          },
        },
      },
      orderBy: {
        currentPeriodEnd: 'asc',
      },
    });

    // Calculate competitor count for each trial
    const trialsWithCounts = await Promise.all(
      trials.map(async (trial) => {
        const competitorCount = await db.competitor.count({
          where: {
            business: {
              userId: trial.userId,
            },
          },
        });

        const now = new Date();
        const periodEnd = new Date(trial.currentPeriodEnd);
        const daysRemaining = Math.ceil((periodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        return {
          id: trial.id,
          userId: trial.userId,
          user: trial.user,
          status: trial.status,
          currentPeriodStart: trial.currentPeriodStart,
          currentPeriodEnd: trial.currentPeriodEnd,
          daysRemaining: Math.max(0, daysRemaining),
          competitorLimit: trial.competitorLimit,
          competitorCount,
        };
      })
    );

    return NextResponse.json({
      trials: trialsWithCounts,
    });
  } catch (error) {
    console.error('Failed to fetch trials:', error);
    return NextResponse.json(
      { error: 'Failed to fetch trials' },
      { status: 500 }
    );
  }
}

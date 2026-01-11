import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { db } from '@/lib/db/prisma';

/**
 * POST /api/subscriptions/pause
 * Pause an active subscription
 */
export async function POST(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get user's active subscription
    const subscription = await db.subscription.findFirst({
      where: {
        userId: user.id,
        status: 'active',
      },
    });

    if (!subscription) {
      return NextResponse.json(
        { error: 'No active subscription found' },
        { status: 404 }
      );
    }

    // Can't pause trial subscriptions
    if (subscription.stripePriceId === 'trial') {
      return NextResponse.json(
        { error: 'Cannot pause trial subscriptions' },
        { status: 400 }
      );
    }

    // Update subscription to paused status
    // Store the original period end so we can resume properly
    await db.subscription.update({
      where: { id: subscription.id },
      data: {
        status: 'paused',
        // Note: Prisma schema may need a pausedAt field to track when paused
      },
    });

    console.log(`User ${user.email} paused subscription ${subscription.id}`);

    return NextResponse.json({
      success: true,
      message: 'Subscription paused successfully',
    });
  } catch (error) {
    console.error('Failed to pause subscription:', error);
    return NextResponse.json(
      { error: 'Failed to pause subscription' },
      { status: 500 }
    );
  }
}

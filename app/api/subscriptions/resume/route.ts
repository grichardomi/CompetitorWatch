import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { db } from '@/lib/db/prisma';

/**
 * POST /api/subscriptions/resume
 * Resume a paused subscription
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

    // Get user's paused subscription
    const subscription = await db.subscription.findFirst({
      where: {
        userId: user.id,
        status: 'paused',
      },
    });

    if (!subscription) {
      return NextResponse.json(
        { error: 'No paused subscription found' },
        { status: 404 }
      );
    }

    // Resume subscription
    // Calculate new period end based on when it was paused
    const now = new Date();
    const newPeriodEnd = new Date(now);
    newPeriodEnd.setMonth(newPeriodEnd.getMonth() + 1);

    await db.subscription.update({
      where: { id: subscription.id },
      data: {
        status: 'active',
        currentPeriodStart: now,
        currentPeriodEnd: newPeriodEnd,
      },
    });

    console.log(`User ${user.email} resumed subscription ${subscription.id}`);

    return NextResponse.json({
      success: true,
      message: 'Subscription resumed successfully',
      newPeriodEnd,
    });
  } catch (error) {
    console.error('Failed to resume subscription:', error);
    return NextResponse.json(
      { error: 'Failed to resume subscription' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { db } from '@/lib/db/prisma';

/**
 * POST /api/admin/subscriptions/resume
 * Admin endpoint to resume any paused subscription
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const adminUser = await db.user.findUnique({
      where: { email: session.user.email },
    });

    if (!adminUser?.isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { subscriptionId } = body;

    if (!subscriptionId) {
      return NextResponse.json(
        { error: 'Missing subscriptionId' },
        { status: 400 }
      );
    }

    const subscription = await db.subscription.findUnique({
      where: { id: subscriptionId },
    });

    if (!subscription) {
      return NextResponse.json(
        { error: 'Subscription not found' },
        { status: 404 }
      );
    }

    if (subscription.status !== 'paused') {
      return NextResponse.json(
        { error: 'Only paused subscriptions can be resumed' },
        { status: 400 }
      );
    }

    // Resume the subscription - extend period by 1 month from now
    const now = new Date();
    const newPeriodEnd = new Date(now);
    newPeriodEnd.setMonth(newPeriodEnd.getMonth() + 1);

    await db.subscription.update({
      where: { id: subscriptionId },
      data: {
        status: 'active',
        currentPeriodStart: now,
        currentPeriodEnd: newPeriodEnd,
      },
    });

    console.log(`Admin ${adminUser.email} resumed subscription ${subscriptionId} for user ${subscription.userId}`);

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

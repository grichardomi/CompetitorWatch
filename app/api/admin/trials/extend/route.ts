import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { db } from '@/lib/db/prisma';

/**
 * POST /api/admin/trials/extend
 * Extend a trial subscription by X days
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
    const { userId, days } = body;

    if (!userId || !days || days <= 0) {
      return NextResponse.json(
        { error: 'Invalid parameters' },
        { status: 400 }
      );
    }

    // Get the user's trial subscription
    const subscription = await db.subscription.findFirst({
      where: {
        userId: parseInt(userId),
        stripePriceId: 'trial',
        status: {
          in: ['trialing', 'grace_period'],
        },
      },
    });

    if (!subscription) {
      return NextResponse.json(
        { error: 'Trial subscription not found' },
        { status: 404 }
      );
    }

    // Extend the trial period
    const newEndDate = new Date(subscription.currentPeriodEnd);
    newEndDate.setDate(newEndDate.getDate() + days);

    // If in grace period, move back to trialing
    const newStatus = subscription.status === 'grace_period' ? 'trialing' : subscription.status;

    await db.subscription.update({
      where: { id: subscription.id },
      data: {
        currentPeriodEnd: newEndDate,
        status: newStatus,
      },
    });

    console.log(`Admin ${adminUser.email} extended trial for user ${userId} by ${days} days`);

    return NextResponse.json({
      success: true,
      message: `Trial extended by ${days} days`,
      newEndDate,
    });
  } catch (error) {
    console.error('Failed to extend trial:', error);
    return NextResponse.json(
      { error: 'Failed to extend trial' },
      { status: 500 }
    );
  }
}

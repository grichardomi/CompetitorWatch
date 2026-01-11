import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { db } from '@/lib/db/prisma';

/**
 * POST /api/admin/trials/convert
 * Convert a trial subscription to a paid plan
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
    const { userId, planId } = body;

    if (!userId || !planId) {
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
      },
    });

    if (!subscription) {
      return NextResponse.json(
        { error: 'Trial subscription not found' },
        { status: 404 }
      );
    }

    // Map plan IDs to limits (should match your pricing)
    const planConfig: Record<string, { limit: number; name: string }> = {
      price_starter: { limit: 5, name: 'Starter' },
      price_professional: { limit: 20, name: 'Professional' },
      price_enterprise: { limit: 100, name: 'Enterprise' },
    };

    const config = planConfig[planId];
    if (!config) {
      return NextResponse.json(
        { error: 'Invalid plan ID' },
        { status: 400 }
      );
    }

    // Convert to paid subscription
    const newPeriodStart = new Date();
    const newPeriodEnd = new Date();
    newPeriodEnd.setMonth(newPeriodEnd.getMonth() + 1);

    await db.subscription.update({
      where: { id: subscription.id },
      data: {
        status: 'active',
        stripePriceId: planId,
        stripeSubscriptionId: `manual_${userId}_${Date.now()}`,
        competitorLimit: config.limit,
        currentPeriodStart: newPeriodStart,
        currentPeriodEnd: newPeriodEnd,
        cancelAtPeriodEnd: false,
      },
    });

    console.log(`Admin ${adminUser.email} converted trial for user ${userId} to ${config.name} plan`);

    return NextResponse.json({
      success: true,
      message: `Trial converted to ${config.name} plan`,
      plan: config.name,
    });
  } catch (error) {
    console.error('Failed to convert trial:', error);
    return NextResponse.json(
      { error: 'Failed to convert trial' },
      { status: 500 }
    );
  }
}

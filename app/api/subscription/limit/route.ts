import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { db } from '@/lib/db/prisma';

export async function GET() {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user from database
    const user = await db.user.findUnique({
      where: { email: session.user.email },
      include: {
        Subscription: {
          select: {
            competitorLimit: true,
          },
          take: 1,
        },
        Business: {
          select: {
            id: true,
          },
          take: 1,
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const subscription = user.Subscription?.[0];
    const competitorLimit = subscription?.competitorLimit || 3;

    // Get current competitor count
    let currentCount = 0;
    if (user.Business?.[0]) {
      currentCount = await db.competitor.count({
        where: { businessId: user.Business[0].id },
      });
    }

    return NextResponse.json({
      competitorLimit,
      currentCount,
      remaining: Math.max(0, competitorLimit - currentCount),
    });
  } catch (error) {
    console.error('Failed to get subscription limit:', error);
    return NextResponse.json(
      { error: 'Failed to get subscription limit' },
      { status: 500 }
    );
  }
}

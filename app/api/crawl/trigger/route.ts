import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { db } from '@/lib/db/prisma';
import { requireActiveSubscription } from '@/lib/middleware/check-subscription';

/**
 * Manual crawl trigger endpoint
 * Allows users to manually trigger a crawl for a specific competitor
 */
export async function POST(req: NextRequest) {
  try {
    // Verify authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user
    const user = await db.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user has an active subscription
    const subscriptionCheck = await requireActiveSubscription(user.id);
    if (!subscriptionCheck.valid) {
      return NextResponse.json(
        {
          error: subscriptionCheck.error,
          errorCode: subscriptionCheck.errorCode,
        },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await req.json();
    const competitorId = body.competitorId;

    if (!competitorId) {
      return NextResponse.json({ error: 'competitorId is required' }, { status: 400 });
    }

    // Verify user owns this competitor
    const competitor = await db.competitor.findFirst({
      where: {
        id: parseInt(competitorId),
        business: {
          userId: user.id,
        },
      },
    });

    if (!competitor) {
      return NextResponse.json({ error: 'Competitor not found' }, { status: 404 });
    }

    // Check if already in queue
    const existing = await db.crawlQueue.findFirst({
      where: { competitorId: competitor.id },
    });

    if (existing) {
      // Count position in queue
      const position = await db.crawlQueue.count({
        where: {
          scheduledFor: {
            lte: existing.scheduledFor,
          },
          priority: {
            gte: existing.priority,
          },
        },
      });

      return NextResponse.json(
        {
          message: 'Already queued',
          queued: true,
          position,
          queueId: existing.id,
        },
        { status: 200 }
      );
    }

    // Create high-priority queue entry
    const job = await db.crawlQueue.create({
      data: {
        competitorId: competitor.id,
        url: competitor.url,
        priority: 1000, // Very high priority for manual triggers
        attempt: 0,
        maxAttempts: 3,
        scheduledFor: new Date(), // Immediate
      },
    });

    console.log(`Manual crawl triggered for competitor ${competitorId} by ${user.email}`);

    return NextResponse.json(
      {
        message: 'Crawl queued successfully',
        queued: true,
        queueId: job.id,
        position: 1,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Trigger crawl error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to trigger crawl' },
      { status: 500 }
    );
  }
}

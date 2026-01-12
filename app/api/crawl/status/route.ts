import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { db } from '@/lib/db/prisma';
import { getQueueStats, getCompetitorsDue } from '@/services/scheduler';

/**
 * Queue status monitoring endpoint
 * Returns current queue state and recent crawl history
 */
export async function GET(_req: NextRequest) {
  try {
    // Verify authentication (optional - allow public access for now, but could require auth)
    await getServerSession(authOptions);

    // Get queue statistics
    const queueStats = await getQueueStats();

    // Get competitors due (limit to 5 most urgent)
    const competitorsDue = await getCompetitorsDue(5);

    // Get recent crawls (last 10 successful snapshots)
    const recentCrawls = await db.priceSnapshot.findMany({
      take: 10,
      orderBy: { detectedAt: 'desc' },
      include: {
        Competitor: {
          select: { id: true, name: true, url: true },
        },
      },
    });

    // Get recent alerts (last 10)
    const recentAlerts = await db.alert.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        Competitor: {
          select: { id: true, name: true },
        },
      },
    });

    return NextResponse.json(
      {
        status: 'ok',
        queue: {
          pending: queueStats.pending,
          maxAttemptFailed: queueStats.maxAttemptFailed,
          averageAttempt: queueStats.averageAttempt,
          oldestJob: queueStats.oldestJob,
        },
        competitorsDue: competitorsDue.map((c: any) => ({
          id: c.id,
          name: c.name,
          url: c.url,
          lastCrawledAt: c.lastCrawledAt,
          frequency: c.crawlFrequencyMinutes,
        })),
        recentCrawls: recentCrawls.map((r) => ({
          id: r.id,
          competitor: r.Competitor.name,
          competitorId: r.Competitor.id,
          timestamp: r.detectedAt,
          pricesCount: (r.extractedData as any).prices?.length || 0,
          promotionsCount: (r.extractedData as any).promotions?.length || 0,
        })),
        recentAlerts: recentAlerts.map((a) => ({
          id: a.id,
          type: a.alertType,
          competitor: a.Competitor?.name,
          message: a.message,
          timestamp: a.createdAt,
          isRead: a.isRead,
        })),
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Status endpoint error:', error);
    return NextResponse.json(
      {
        status: 'error',
        message: error instanceof Error ? error.message : 'Failed to get status',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

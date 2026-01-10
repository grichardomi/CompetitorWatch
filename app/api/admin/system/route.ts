import { checkAdminAccess } from '@/lib/auth/check-admin';
import { db } from '@/lib/db/prisma';

export async function GET() {
  try {
    // Check admin access
    const { authorized } = await checkAdminAccess();
    if (!authorized) {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Email Queue Stats
    const emailQueuePending = await db.emailQueue.count({
      where: { status: 'pending' },
    });
    const emailQueueSent = await db.emailQueue.count({
      where: { status: 'sent' },
    });
    const emailQueueFailed = await db.emailQueue.count({
      where: { status: 'failed' },
    });

    // Crawl Queue Stats
    const crawlQueueTotal = await db.crawlQueue.count();
    const crawlQueuePending = await db.crawlQueue.count({
      where: {
        scheduledFor: {
          lte: new Date(),
        },
      },
    });

    // Webhook Events
    const webhookUnprocessed = await db.webhookEvent.count({
      where: { processed: false },
    });
    const webhookFailed = await db.webhookEvent.count({
      where: {
        processed: true,
        error: { not: null },
      },
    });
    const recentWebhookEvents = await db.webhookEvent.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        id: true,
        source: true,
        eventType: true,
        processed: true,
        error: true,
        createdAt: true,
      },
    });

    // Database Record Counts
    const userCount = await db.user.count();
    const businessCount = await db.business.count();
    const competitorCount = await db.competitor.count();
    const alertCount = await db.alert.count();

    return Response.json({
      emailQueue: {
        pending: emailQueuePending,
        sent: emailQueueSent,
        failed: emailQueueFailed,
      },
      crawlQueue: {
        pending: crawlQueuePending,
        total: crawlQueueTotal,
      },
      webhookEvents: {
        unprocessed: webhookUnprocessed,
        failed: webhookFailed,
        recent: recentWebhookEvents,
      },
      database: {
        users: userCount,
        businesses: businessCount,
        competitors: competitorCount,
        alerts: alertCount,
      },
    });
  } catch (error) {
    console.error('Admin system stats error:', error);
    return Response.json(
      { error: 'Failed to fetch system stats' },
      { status: 500 }
    );
  }
}

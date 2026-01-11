import { db } from '@/lib/db/prisma';

export interface SchedulerResult {
  enqueued: number;
  skipped: number;
  errors: number;
  message: string;
}

/**
 * Find competitors that are due for crawling and enqueue them
 */
export async function enqueueJobs(): Promise<SchedulerResult> {
  console.log('Starting scheduler...');

  try {
    // Find active competitors that are due for crawling
    // Only include competitors from users with active subscriptions
    const dueCompetitors = await db.$queryRaw<any[]>`
      SELECT c.id, c.url, c."crawlFrequencyMinutes", c."lastCrawledAt"
      FROM "Competitor" c
      INNER JOIN "Business" b ON c."businessId" = b.id
      INNER JOIN "Subscription" s ON s."userId" = b."userId"
      WHERE c."isActive" = true
        AND (
          c."lastCrawledAt" IS NULL
          OR c."lastCrawledAt" + (c."crawlFrequencyMinutes" * INTERVAL '1 minute') < NOW()
        )
        AND NOT EXISTS (
          SELECT 1 FROM "CrawlQueue" cq
          WHERE cq."competitorId" = c.id
        )
        -- Include active, trialing (not expired), and grace_period
        AND (
          s.status = 'active'
          OR (s.status = 'trialing' AND s."currentPeriodEnd" > NOW())
          OR (s.status = 'grace_period' AND s."currentPeriodEnd" + INTERVAL '3 days' > NOW())
        )
      ORDER BY c."lastCrawledAt" ASC NULLS FIRST
      LIMIT 100
    `;

    console.log(`Found ${dueCompetitors.length} competitors due for crawling`);

    let enqueued = 0;
    let skipped = 0;
    let errors = 0;

    for (const competitor of dueCompetitors) {
      try {
        // Determine priority: first crawls are high priority (100), others are normal (0)
        const isFirstCrawl = !competitor.lastCrawledAt;
        const priority = isFirstCrawl ? 100 : 0;

        // Enqueue job
        await db.crawlQueue.create({
          data: {
            competitorId: competitor.id,
            url: competitor.url,
            priority,
            attempt: 0,
            maxAttempts: 3,
            scheduledFor: new Date(),
          },
        });

        enqueued++;
        console.log(
          `Enqueued competitor ${competitor.id} (${competitor.url}) - priority: ${priority}`
        );
      } catch (error) {
        // Likely duplicate key error if job already exists - skip silently
        if (error instanceof Error && error.message.includes('Unique constraint')) {
          skipped++;
        } else {
          errors++;
          console.error(`Error enqueuing competitor ${competitor.id}:`, error);
        }
      }
    }

    const message = `Scheduler complete: enqueued ${enqueued}, skipped ${skipped}, errors ${errors}`;
    console.log(message);

    return {
      enqueued,
      skipped,
      errors,
      message,
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error('Scheduler error:', errorMsg);

    return {
      enqueued: 0,
      skipped: 0,
      errors: 1,
      message: `Scheduler error: ${errorMsg}`,
    };
  }
}

/**
 * Get queue statistics
 */
export async function getQueueStats(): Promise<{
  pending: number;
  maxAttemptFailed: number;
  averageAttempt: number;
  oldestJob: Date | null;
}> {
  try {
    const stats = await db.$queryRaw<any[]>`
      SELECT
        COUNT(*) as total,
        COUNT(CASE WHEN attempt >= "maxAttempts" THEN 1 END) as max_attempt_failed,
        AVG(attempt) as avg_attempt,
        MIN("scheduledFor") as oldest_job
      FROM "CrawlQueue"
    `;

    if (stats.length === 0) {
      return {
        pending: 0,
        maxAttemptFailed: 0,
        averageAttempt: 0,
        oldestJob: null,
      };
    }

    const stat = stats[0];
    return {
      pending: parseInt(stat.total || 0),
      maxAttemptFailed: parseInt(stat.max_attempt_failed || 0),
      averageAttempt: parseFloat(stat.avg_attempt || 0),
      oldestJob: stat.oldest_job ? new Date(stat.oldest_job) : null,
    };
  } catch (error) {
    console.error('Failed to get queue stats:', error);
    return {
      pending: 0,
      maxAttemptFailed: 0,
      averageAttempt: 0,
      oldestJob: null,
    };
  }
}

/**
 * Get competitors due for crawling (for monitoring)
 */
export async function getCompetitorsDue(limit: number = 10): Promise<any[]> {
  try {
    const due = await db.$queryRaw<any[]>`
      SELECT c.id, c.name, c.url, c."lastCrawledAt", c."crawlFrequencyMinutes"
      FROM "Competitor" c
      INNER JOIN "Business" b ON c."businessId" = b.id
      INNER JOIN "Subscription" s ON s."userId" = b."userId"
      WHERE c."isActive" = true
        AND (
          c."lastCrawledAt" IS NULL
          OR c."lastCrawledAt" + (c."crawlFrequencyMinutes" * INTERVAL '1 minute') < NOW()
        )
        -- Include active, trialing (not expired), and grace_period
        AND (
          s.status = 'active'
          OR (s.status = 'trialing' AND s."currentPeriodEnd" > NOW())
          OR (s.status = 'grace_period' AND s."currentPeriodEnd" + INTERVAL '3 days' > NOW())
        )
      ORDER BY c."lastCrawledAt" ASC NULLS FIRST
      LIMIT ${limit}
    `;

    return due;
  } catch (error) {
    console.error('Failed to get competitors due:', error);
    return [];
  }
}

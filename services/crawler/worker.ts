import { db } from '@/lib/db/prisma';
import { crawlUrl } from './playwright-client';
import { extractData } from './ai-extractor';
import { detectChanges } from './change-detector';
import { checkRateLimit } from './rate-limiter';
import { hashContent } from '@/lib/utils/hash';
import { type Industry } from '@/lib/config/industries';
import { detectCompetitorIndustry, getEffectiveIndustry } from '../competitor/industry-detector';

const CRAWL_TIMEOUT_MS = parseInt(process.env.CRAWLER_TIMEOUT_MS || '30000', 10);

export interface CrawlJob {
  id: number;
  competitorId: number;
  url: string;
  priority: number;
  attempt: number;
  maxAttempts: number;
}

export interface ProcessResult {
  success: boolean;
  competitorId: number;
  message: string;
  snapshotHash?: string;
  alertsCreated?: number;
  error?: string;
}

/**
 * Dequeue and process next job atomically
 */
export async function dequeueNextJob(): Promise<CrawlJob | null> {
  try {
    // Use raw query for atomic SKIP LOCKED dequeue
    const jobs = await db.$queryRaw<any[]>`
      DELETE FROM "CrawlQueue"
      WHERE id = (
        SELECT id FROM "CrawlQueue"
        WHERE "scheduledFor" <= NOW()
          AND attempt < "maxAttempts"
        ORDER BY priority DESC, "scheduledFor" ASC
        FOR UPDATE SKIP LOCKED
        LIMIT 1
      )
      RETURNING id, "competitorId", url, priority, attempt, "maxAttempts"
    `;

    return jobs.length > 0 ? jobs[0] : null;
  } catch (error) {
    console.error('Failed to dequeue job:', error);
    return null;
  }
}

/**
 * Process a single crawl job
 */
export async function processJob(job: CrawlJob): Promise<ProcessResult> {
  console.log(`Processing job ${job.id} for competitor ${job.competitorId}`);

  try {
    // Get competitor and business info
    const competitor = await db.competitor.findUnique({
      where: { id: job.competitorId },
      include: { Business: true },
    });

    if (!competitor) {
      return {
        success: false,
        competitorId: job.competitorId,
        message: 'Competitor not found',
        error: 'COMPETITOR_NOT_FOUND',
      };
    }

    // Check rate limit
    const withinLimit = await checkRateLimit(competitor.url);
    if (!withinLimit) {
      console.log(`Rate limited for ${competitor.url}, rescheduling...`);
      // Re-enqueue for later
      await db.crawlQueue.create({
        data: {
          competitorId: competitor.id,
          url: competitor.url,
          priority: 0,
          attempt: job.attempt + 1,
          maxAttempts: job.maxAttempts,
          scheduledFor: new Date(Date.now() + 30 * 60 * 1000), // Retry in 30 min
        },
      });

      return {
        success: false,
        competitorId: job.competitorId,
        message: 'Rate limited, rescheduled for later',
        error: 'RATE_LIMITED',
      };
    }

    // Step 1: Crawl the URL
    console.log(`[Job ${job.id}] Crawling ${competitor.url}`);
    let html: string;
    try {
      html = await crawlUrl(competitor.url, {
        timeoutMs: CRAWL_TIMEOUT_MS,
        waitForNetworkIdle: true,
      });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      console.error(`[Job ${job.id}] Crawl failed: ${errorMsg}`);

      // Retry if attempts remain
      if (job.attempt < job.maxAttempts) {
        await db.crawlQueue.create({
          data: {
            competitorId: competitor.id,
            url: competitor.url,
            priority: job.priority,
            attempt: job.attempt + 1,
            maxAttempts: job.maxAttempts,
            scheduledFor: new Date(Date.now() + 5 * 60 * 1000), // Retry in 5 min
          },
        });
      }

      return {
        success: false,
        competitorId: job.competitorId,
        message: `Crawl failed: ${errorMsg}`,
        error: 'CRAWL_FAILED',
      };
    }

    // Step 2: Detect/verify industry and extract data
    console.log(`[Job ${job.id}] Extracting data`);
    let extractedData;
    try {
      // Determine effective industry for this competitor
      let effectiveIndustry = getEffectiveIndustry(
        competitor,
        competitor.Business.industry
      );

      // If this is first crawl or low confidence, re-detect with HTML content
      const isFirstCrawl = !competitor.lastCrawledAt;
      const hasLowConfidence =
        competitor.industryConfidence &&
        parseFloat(competitor.industryConfidence.toString()) < 0.7;

      if ((isFirstCrawl || hasLowConfidence) && html) {
        console.log(
          `[Job ${job.id}] ${isFirstCrawl ? 'First crawl' : 'Low confidence'} - re-detecting industry with content`
        );

        const detection = await detectCompetitorIndustry(
          competitor.url,
          html,
          competitor.Business.industry as Industry
        );

        // Update competitor with improved detection
        await db.competitor.update({
          where: { id: competitor.id },
          data: {
            detectedIndustry: detection.industry,
            industryConfidence: detection.confidence,
            // Only update industry if not manually set
            ...((!competitor.industry || competitor.industry === competitor.detectedIndustry) && {
              industry: detection.industry,
            }),
          },
        });

        effectiveIndustry = detection.industry;
        console.log(
          `[Job ${job.id}] Industry updated: ${detection.industry} (${detection.confidence})`
        );
      }

      console.log(`[Job ${job.id}] Using industry: ${effectiveIndustry}`);
      extractedData = await extractData(html, effectiveIndustry);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      console.error(`[Job ${job.id}] Extraction failed: ${errorMsg}`);

      return {
        success: false,
        competitorId: job.competitorId,
        message: `Extraction failed: ${errorMsg}`,
        error: 'EXTRACTION_FAILED',
      };
    }

    // Step 3: Store snapshot
    console.log(`[Job ${job.id}] Storing snapshot`);
    const snapshotHash = hashContent(JSON.stringify(extractedData));

    let alertsCreated = 0;
    try {
      // Create snapshot
      await db.priceSnapshot.create({
        data: {
          competitorId: competitor.id,
          extractedData: extractedData as any,
          snapshotHash,
          detectedAt: new Date(),
        },
      });

      // Step 4: Detect changes and create alerts
      console.log(`[Job ${job.id}] Detecting changes`);
      const changeResult = await detectChanges(
        competitor.id,
        competitor.businessId,
        extractedData,
        snapshotHash
      );

      alertsCreated = changeResult.changeTypes.length;
      console.log(
        `[Job ${job.id}] Change detection: ${changeResult.changeTypes.join(', ') || 'no changes'}`
      );
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      console.error(`[Job ${job.id}] Snapshot/alert creation failed: ${errorMsg}`);

      return {
        success: false,
        competitorId: job.competitorId,
        message: `Snapshot creation failed: ${errorMsg}`,
        error: 'SNAPSHOT_FAILED',
      };
    }

    // Step 5: Update competitor last crawled time
    try {
      await db.competitor.update({
        where: { id: competitor.id },
        data: {
          lastCrawledAt: new Date(),
        },
      });
    } catch (error) {
      console.error(`[Job ${job.id}] Failed to update competitor:`, error);
      // Non-critical, continue
    }

    console.log(`[Job ${job.id}] ✓ Successfully processed (${alertsCreated} alerts)`);
    return {
      success: true,
      competitorId: job.competitorId,
      message: `Successfully crawled and extracted data`,
      snapshotHash,
      alertsCreated,
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[Job ${job.id}] Unexpected error:`, errorMsg);

    return {
      success: false,
      competitorId: job.competitorId,
      message: `Unexpected error: ${errorMsg}`,
      error: 'UNKNOWN_ERROR',
    };
  }
}

/**
 * Process multiple jobs from queue
 */
export async function processQueueBatch(maxJobs: number = 10): Promise<{
  processed: number;
  successful: number;
  failed: number;
  results: ProcessResult[];
}> {
  const results: ProcessResult[] = [];
  let successful = 0;
  let failed = 0;

  console.log(`Starting batch processing (max ${maxJobs} jobs)...`);

  for (let i = 0; i < maxJobs; i++) {
    // Check timeout - exit before Railway's 10min limit
    const elapsed = Date.now() - (process.env.JOB_START_TIME ? parseInt(process.env.JOB_START_TIME) : 0);
    if (elapsed > 9 * 60 * 1000) {
      console.log('Approaching timeout, exiting batch');
      break;
    }

    const job = await dequeueNextJob();
    if (!job) {
      console.log('No more jobs in queue');
      break;
    }

    const result = await processJob(job);
    results.push(result);

    if (result.success) {
      successful++;
    } else {
      failed++;
    }
  }

  console.log(`Batch complete: ${successful} successful, ${failed} failed`);

  return {
    processed: results.length,
    successful,
    failed,
    results,
  };
}

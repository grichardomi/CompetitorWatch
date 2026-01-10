import { NextRequest, NextResponse } from 'next/server';
import { processQueueBatch } from '@/services/crawler/worker';

/**
 * Worker cron endpoint
 * Runs every 5 minutes to process crawl jobs from queue
 */
export async function GET(req: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret || !authHeader || !authHeader.includes(cronSecret)) {
      console.warn('Unauthorized cron request to worker');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Worker cron triggered');

    // Set job start time for timeout tracking
    process.env.JOB_START_TIME = Date.now().toString();

    // Get batch size from env or use default
    const batchSize = parseInt(process.env.CRAWLER_BATCH_SIZE || '10', 10);

    // Process batch of jobs with timeout protection
    // Railway allows 10min, but we exit after 9min to be safe
    let result;
    try {
      result = await Promise.race([
        processQueueBatch(batchSize),
        new Promise((_, reject) =>
          setTimeout(
            () => reject(new Error('Processing timeout')),
            9 * 60 * 1000 // 9 minutes
          )
        ),
      ]);
    } catch (timeoutError) {
      console.log('Worker timeout - exiting gracefully');
      result = {
        processed: 0,
        successful: 0,
        failed: 0,
        results: [],
      };
    }

    return NextResponse.json(
      {
        status: 'success',
        processed: result.processed,
        successful: result.successful,
        failed: result.failed,
        results: result.results,
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Worker cron error:', error);
    return NextResponse.json(
      {
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

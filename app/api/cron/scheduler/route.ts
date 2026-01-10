import { NextRequest, NextResponse } from 'next/server';
import { enqueueJobs } from '@/services/scheduler';

/**
 * Scheduler cron endpoint
 * Runs every 15 minutes to find due competitors and enqueue crawl jobs
 */
export async function GET(req: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret || !authHeader || !authHeader.includes(cronSecret)) {
      console.warn('Unauthorized cron request to scheduler');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Scheduler cron triggered');

    // Run scheduler
    const result = await enqueueJobs();

    return NextResponse.json(
      {
        status: 'success',
        enqueued: result.enqueued,
        skipped: result.skipped,
        errors: result.errors,
        message: result.message,
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Scheduler cron error:', error);
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

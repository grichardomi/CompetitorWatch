import { NextRequest, NextResponse } from 'next/server';
import { processEmailQueue, getEmailQueueStats } from '@/services/email-worker';

const CRON_SECRET = process.env.CRON_SECRET;
const BATCH_SIZE = parseInt(process.env.EMAIL_BATCH_SIZE || '50', 10);
const TIMEOUT_MS = 9 * 60 * 1000; // 9 minutes (Railway limit is 10 min)

/**
 * Email worker cron endpoint
 * GET /api/cron/email-worker
 *
 * Processes pending emails from queue.
 * Protected by CRON_SECRET header.
 * Should be called every 5 minutes via cron job.
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();

  // Verify cron secret
  const cronSecret = request.headers.get('Authorization')?.replace('Bearer ', '');
  if (!CRON_SECRET || cronSecret !== CRON_SECRET) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    // Get initial queue stats
    const initialStats = await getEmailQueueStats();

    // Process email queue with timeout protection
    const processResult = await Promise.race([
      processEmailQueue(BATCH_SIZE),
      new Promise((_, reject) =>
        setTimeout(
          () => reject(new Error(`Email processing timeout after ${TIMEOUT_MS / 1000}s`)),
          TIMEOUT_MS
        )
      ),
    ]);

    const elapsed = Date.now() - startTime;

    return NextResponse.json(
      {
        status: 'success',
        message: 'Email queue processed',
        timestamp: new Date().toISOString(),
        processing: {
          processed: (processResult as any).processed,
          sent: (processResult as any).sent,
          failed: (processResult as any).failed,
          retried: (processResult as any).retried,
          skipped: (processResult as any).skipped,
        },
        queue: {
          beforeProcessing: {
            pending: initialStats.pending,
            sent: initialStats.sent,
            failed: initialStats.failed,
            totalQueued: initialStats.totalQueued,
          },
        },
        elapsedMs: elapsed,
      },
      { status: 200 }
    );
  } catch (error) {
    const elapsed = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    console.error('Email worker error:', error);

    return NextResponse.json(
      {
        status: 'error',
        error: errorMessage,
        timestamp: new Date().toISOString(),
        elapsedMs: elapsed,
      },
      { status: 500 }
    );
  }
}

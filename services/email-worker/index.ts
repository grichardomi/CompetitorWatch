import { db } from '@/lib/db/prisma';
import { sendQueuedEmail } from './send';

interface ProcessStats {
  processed: number;
  sent: number;
  failed: number;
  retried: number;
  skipped: number;
  errors: string[];
}

/**
 * Process a batch of pending emails
 * Rate limited to prevent overwhelming email service
 */
export async function processEmailQueue(batchSize: number = 50): Promise<ProcessStats> {
  const stats: ProcessStats = {
    processed: 0,
    sent: 0,
    failed: 0,
    retried: 0,
    skipped: 0,
    errors: [],
  };

  try {
    // Fetch pending emails that are due to be sent
    const pendingEmails = await db.emailQueue.findMany({
      where: {
        status: 'pending',
        scheduledFor: {
          lte: new Date(), // Only emails where scheduledFor <= now
        },
      },
      orderBy: {
        scheduledFor: 'asc', // Process oldest first
      },
      take: batchSize,
    });

    // Process each email with rate limiting (100ms between sends)
    for (const email of pendingEmails) {
      try {
        const result = await sendQueuedEmail(email.id);

        stats.processed++;

        if (result.success) {
          stats.sent++;
        } else if (result.message?.includes('retry')) {
          stats.retried++;
        } else {
          stats.failed++;
        }
      } catch (error) {
        stats.processed++;
        stats.failed++;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        stats.errors.push(`${email.id}: ${errorMessage}`);
        console.error(`Failed to send email ${email.id}:`, error);
      }

      // Rate limiting - small delay between sends (100ms)
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    // Log summary
    console.log('Email batch processing complete:', {
      processed: stats.processed,
      sent: stats.sent,
      failed: stats.failed,
      retried: stats.retried,
      skipped: stats.skipped,
    });
  } catch (error) {
    console.error('Error processing email queue:', error);
    stats.errors.push(error instanceof Error ? error.message : 'Unknown error');
  }

  return stats;
}

/**
 * Get email queue statistics for monitoring
 */
export async function getEmailQueueStats(): Promise<{
  pending: number;
  sent: number;
  failed: number;
  totalQueued: number;
  oldestPending?: Date;
  averageAttemptsForFailed?: number;
}> {
  try {
    const [pending, sent, failed] = await Promise.all([
      db.emailQueue.count({ where: { status: 'pending' } }),
      db.emailQueue.count({ where: { status: 'sent' } }),
      db.emailQueue.count({ where: { status: 'failed' } }),
    ]);

    // Get oldest pending email
    const oldestPending = await db.emailQueue.findFirst({
      where: { status: 'pending' },
      orderBy: { scheduledFor: 'asc' },
      select: { scheduledFor: true },
    });

    // Calculate average attempts for failed emails
    const failedEmails = await db.emailQueue.findMany({
      where: { status: 'failed' },
      select: { attempts: true },
    });

    const averageAttempts =
      failedEmails.length > 0
        ? failedEmails.reduce((sum, e) => sum + e.attempts, 0) / failedEmails.length
        : 0;

    return {
      pending,
      sent,
      failed,
      totalQueued: pending + sent + failed,
      oldestPending: oldestPending?.scheduledFor,
      averageAttemptsForFailed: Math.round(averageAttempts * 100) / 100,
    };
  } catch (error) {
    console.error('Error fetching email queue stats:', error);
    return {
      pending: 0,
      sent: 0,
      failed: 0,
      totalQueued: 0,
    };
  }
}

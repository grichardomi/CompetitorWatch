import { db } from '@/lib/db/prisma';
import { renderEmailTemplate, generateSubject } from '@/lib/email/render';
import { sendEmail } from '@/lib/email/client';

/**
 * Exponential backoff retry schedule (in minutes)
 * Max 3 attempts total
 */
const RETRY_SCHEDULE = [5, 15, 45]; // 5min, then 15min, then 45min

/**
 * Send a queued email
 */
export async function sendQueuedEmail(emailQueueId: number): Promise<{
  success: boolean;
  message?: string;
  error?: string;
}> {
  try {
    // Fetch email from queue
    const queueEntry = await db.emailQueue.findUnique({
      where: { id: emailQueueId },
    });

    if (!queueEntry) {
      return { success: false, error: 'Email queue entry not found' };
    }

    // Check if it's due (scheduledFor <= now)
    if (queueEntry.scheduledFor > new Date()) {
      return {
        success: false,
        message: 'Email not yet due to be sent',
      };
    }

    // Don't resend already sent emails
    if (queueEntry.status === 'sent') {
      return { success: false, message: 'Email already sent' };
    }

    // Don't resend permanently failed emails
    if (queueEntry.status === 'failed') {
      return { success: false, message: 'Email marked as permanently failed' };
    }

    // Check if max attempts exceeded
    if (queueEntry.attempts >= queueEntry.maxAttempts) {
      await db.emailQueue.update({
        where: { id: emailQueueId },
        data: {
          status: 'failed',
          error: 'Max retries exceeded',
        },
      });
      return { success: false, message: 'Max attempts exceeded' };
    }

    // Render template to HTML
    const renderResult = await renderEmailTemplate({
      templateName: queueEntry.templateName,
      templateData: queueEntry.templateData,
    });

    if (!renderResult.success || !renderResult.html) {
      // Template rendering failed - mark as failed permanently
      await db.emailQueue.update({
        where: { id: emailQueueId },
        data: {
          status: 'failed',
          error: `Template render failed: ${renderResult.error}`,
        },
      });

      return {
        success: false,
        error: `Template render failed: ${renderResult.error}`,
      };
    }

    // Generate subject line
    const templateData = queueEntry.templateData as any;
    const alertType = templateData?.alertType || 'update';
    const competitorName = templateData?.competitorName || 'Competitor';
    const subject = generateSubject(alertType, competitorName);

    // Send via Resend
    let emailResult: { success: boolean; error?: string } | null = null;
    try {
      await sendEmail({
        from: 'alerts@competitorwatch.com',
        to: queueEntry.toEmail,
        subject,
        html: renderResult.html,
      });
      emailResult = { success: true };
    } catch (error) {
      emailResult = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }

    if (!emailResult || !emailResult.success) {
      // Email send failed - check if we should retry
      const shouldRetry = queueEntry.attempts < RETRY_SCHEDULE.length;

      if (shouldRetry) {
        // Schedule next retry
        const nextRetryMinutes = RETRY_SCHEDULE[queueEntry.attempts];
        const nextRetryAt = new Date(Date.now() + nextRetryMinutes * 60 * 1000);

        await db.emailQueue.update({
          where: { id: emailQueueId },
          data: {
            attempts: queueEntry.attempts + 1,
            scheduledFor: nextRetryAt,
            error: emailResult.error,
          },
        });

        return {
          success: false,
          message: `Send failed, retry scheduled in ${nextRetryMinutes} minutes`,
          error: emailResult.error,
        };
      } else {
        // Max retries exceeded
        await db.emailQueue.update({
          where: { id: emailQueueId },
          data: {
            status: 'failed',
            error: `Max retries exceeded: ${emailResult.error}`,
          },
        });

        return {
          success: false,
          error: `Max retries exceeded: ${emailResult.error}`,
        };
      }
    }

    // Success - update status to sent
    await db.emailQueue.update({
      where: { id: emailQueueId },
      data: {
        status: 'sent',
        sentAt: new Date(),
      },
    });

    return {
      success: true,
      message: `Email sent to ${queueEntry.toEmail}`,
    };
  } catch (error) {
    console.error(`Error sending email ${emailQueueId}:`, error);

    // Try to update queue entry with error
    try {
      await db.emailQueue.update({
        where: { id: emailQueueId },
        data: {
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      });
    } catch (updateError) {
      console.error('Failed to update queue entry:', updateError);
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

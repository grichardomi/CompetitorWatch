import { db } from '@/lib/db/prisma';
import { calculateScheduledTime } from './quiet-hours';
import { getDashboardUrl } from '@/lib/config/env';

interface EnqueueEmailParams {
  userId: number;
  toEmail: string;
  templateName: string;
  templateData: any;
  alertType: string;
}

/**
 * Enqueue an email respecting user notification preferences
 */
export async function enqueueEmail({
  userId,
  toEmail,
  templateName,
  templateData,
  alertType,
}: EnqueueEmailParams): Promise<{ success: boolean; queueId?: string; reason?: string }> {
  try {
    // Fetch user preferences
    const preferences = await db.notificationPreferences.findUnique({
      where: { userId },
    });

    // If no preferences or email disabled, skip
    if (!preferences || !preferences.emailEnabled) {
      return {
        success: false,
        reason: 'Email notifications disabled or preferences not found',
      };
    }

    // Check if this alert type is enabled
    const alertTypes = preferences.alertTypes as string[] | null;
    if (!alertTypes || !alertTypes.includes(alertType)) {
      return {
        success: false,
        reason: `Alert type "${alertType}" not enabled`,
      };
    }

    // Calculate when to send (respecting quiet hours)
    const now = new Date();
    const scheduledFor = calculateScheduledTime(
      now,
      preferences.quietHoursStart,
      preferences.quietHoursEnd,
      preferences.timezone
    );

    // Insert into EmailQueue
    const queueEntry = await db.emailQueue.create({
      data: {
        userId,
        toEmail,
        templateName,
        templateData,
        scheduledFor,
        status: 'pending',
      },
    });

    return {
      success: true,
      queueId: String(queueEntry.id),
    };
  } catch (error) {
    console.error('Failed to enqueue email:', error);
    return {
      success: false,
      reason: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Convenience function to enqueue email for an alert
 */
export async function enqueueAlertEmail(alertId: number): Promise<{ success: boolean; reason?: string }> {
  try {
    // Fetch alert with related data
    const alert = await db.alert.findUnique({
      where: { id: alertId },
      include: {
        business: {
          include: {
            user: true,
          },
        },
        competitor: true,
      },
    });

    if (!alert) {
      return { success: false, reason: 'Alert not found' };
    }

    if (!alert.business?.user?.email) {
      return { success: false, reason: 'User email not found' };
    }

    // Prepare template data
    const templateData = {
      competitorName: alert.competitor?.name || 'Unknown Competitor',
      alertType: alert.alertType,
      message: alert.message,
      details: alert.details,
      dashboardUrl: getDashboardUrl('/dashboard/alerts'),
      unsubscribeUrl: getDashboardUrl('/dashboard/settings'),
    };

    // Enqueue email
    return await enqueueEmail({
      userId: alert.business!.userId,
      toEmail: alert.business!.user.email,
      templateName: 'alert_notification',
      templateData,
      alertType: alert.alertType,
    });
  } catch (error) {
    console.error('Failed to enqueue alert email:', error);
    return {
      success: false,
      reason: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

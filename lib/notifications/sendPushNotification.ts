import webpush from 'web-push';
import { db } from '@/lib/db/prisma';

// Configure web-push with VAPID keys
const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
const vapidSubject = process.env.VAPID_SUBJECT || 'mailto:support@nexusmeme.com';

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
}

export interface PushNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  url?: string;
  tag?: string;
}

/**
 * Send a push notification to all subscribed devices for a user
 */
export async function sendPushNotification(
  userId: number,
  payload: PushNotificationPayload
): Promise<{ sent: number; failed: number; errors: string[] }> {
  if (!vapidPublicKey || !vapidPrivateKey) {
    console.warn('VAPID keys not configured, skipping push notifications');
    return { sent: 0, failed: 0, errors: ['VAPID keys not configured'] };
  }

  try {
    // Get all push subscriptions for the user
    const subscriptions = await db.pushSubscription.findMany({
      where: { userId },
    });

    if (subscriptions.length === 0) {
      return { sent: 0, failed: 0, errors: [] };
    }

    // Prepare the notification payload
    const notificationPayload = JSON.stringify({
      title: payload.title,
      body: payload.body,
      icon: payload.icon || '/icon-192.png',
      badge: payload.badge || '/badge-72.png',
      tag: payload.tag || 'notification',
      data: {
        url: payload.url || '/dashboard/alerts',
      },
    });

    // Send to all subscriptions
    const results = await Promise.allSettled(
      subscriptions.map(async (subscription) => {
        try {
          await webpush.sendNotification(
            {
              endpoint: subscription.endpoint,
              keys: {
                p256dh: subscription.p256dh,
                auth: subscription.auth,
              },
            },
            notificationPayload
          );

          // Update last used timestamp
          await db.pushSubscription.update({
            where: { id: subscription.id },
            data: { lastUsedAt: new Date() },
          });

          return { success: true, subscriptionId: subscription.id };
        } catch (error: any) {
          // If subscription is expired or invalid, remove it
          if (error.statusCode === 410 || error.statusCode === 404) {
            await db.pushSubscription.delete({
              where: { id: subscription.id },
            });
          }
          throw error;
        }
      })
    );

    // Count successes and failures
    let sent = 0;
    let failed = 0;
    const errors: string[] = [];

    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        sent++;
      } else {
        failed++;
        errors.push(`Subscription ${subscriptions[index].id}: ${result.reason.message}`);
      }
    });

    return { sent, failed, errors };
  } catch (error) {
    console.error('Error sending push notifications:', error);
    return {
      sent: 0,
      failed: 0,
      errors: [error instanceof Error ? error.message : 'Unknown error'],
    };
  }
}

/**
 * Send a push notification to all users for a specific alert
 */
export async function sendAlertPushNotification(
  alertId: number
): Promise<{ sent: number; failed: number }> {
  try {
    // Get the alert with related data
    const alert = await db.alert.findUnique({
      where: { id: alertId },
      include: {
        Competitor: {
          include: {
            Business: {
              include: {
                User: true,
              },
            },
          },
        },
      },
    });

    if (!alert || !alert.Competitor?.Business?.User) {
      return { sent: 0, failed: 0 };
    }

    const user = alert.Competitor.Business.User;
    const competitor = alert.Competitor;

    // Create notification payload
    const payload: PushNotificationPayload = {
      title: 'New Alert from MarketPulse',
      body: `${alert.alertType}: ${competitor.name || competitor.url}`,
      url: '/dashboard/alerts',
      tag: `alert-${alertId}`,
    };

    const result = await sendPushNotification(user.id, payload);
    return { sent: result.sent, failed: result.failed };
  } catch (error) {
    console.error('Error sending alert push notification:', error);
    return { sent: 0, failed: 0 };
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { enqueueEmail } from '@/lib/email/enqueue';
import { db } from '@/lib/db/prisma';
import { getDashboardUrl } from '@/lib/config/env';

/**
 * Send a test email to the authenticated user
 * POST /api/notifications/test-email
 */
export async function POST(_request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user from database
    const user = await db.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Demo alert data
    const testAlertType = 'price_change';
    const testCompetitorName = 'Demo Restaurant';
    const testMessage = 'This is a test email from MarketPulse. Your notification preferences are working correctly!';
    const testDetails = {
      updated: [
        {
          item: 'Classic Burger',
          oldPrice: '$12.99',
          newPrice: '$11.99',
          reduced: true,
        },
        {
          item: 'Caesar Salad',
          oldPrice: '$9.99',
          newPrice: '$10.99',
          reduced: false,
        },
      ],
    };

    // Enqueue test email
    const result = await enqueueEmail({
      userId: user.id,
      toEmail: user.email,
      templateName: 'alert_notification',
      templateData: {
        competitorName: testCompetitorName,
        alertType: testAlertType,
        message: testMessage,
        details: testDetails,
        dashboardUrl: getDashboardUrl('/dashboard/alerts'),
        unsubscribeUrl: getDashboardUrl('/dashboard/settings'),
      },
      alertType: testAlertType,
    });

    if (!result.success) {
      return NextResponse.json(
        {
          error: 'Failed to queue test email',
          reason: result.reason,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Test email queued successfully',
        queueId: result.queueId,
        details: {
          email: user.email,
          alertType: testAlertType,
          competitor: testCompetitorName,
          note: 'Email will be sent based on your notification preferences and quiet hours settings',
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error sending test email:', error);
    return NextResponse.json(
      {
        error: 'Failed to send test email',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

import { render } from '@react-email/render';
import AlertNotification from '@/emails/alert-notification';
import WelcomeEmail from '@/emails/welcome-email';
import TrialDay7Reminder from '@/emails/trial-day7-reminder';
import TrialDay11Reminder from '@/emails/trial-day11-reminder';
import TrialEnded from '@/emails/trial-ended';
import GracePeriodEnded from '@/emails/grace-period-ended';

interface RenderEmailParams {
  templateName: string;
  templateData: any;
}

interface RenderResult {
  success: boolean;
  html?: string;
  error?: string;
}

/**
 * Render email template to HTML
 */
export async function renderEmailTemplate({
  templateName,
  templateData,
}: RenderEmailParams): Promise<RenderResult> {
  try {
    // Map template names to components
    const templates: Record<string, any> = {
      alert_notification: AlertNotification,
      welcome_email: WelcomeEmail,
      trial_day7_reminder: TrialDay7Reminder,
      trial_day11_reminder: TrialDay11Reminder,
      trial_ended: TrialEnded,
      grace_period_ended: GracePeriodEnded,
    };

    const TemplateComponent = templates[templateName];

    if (!TemplateComponent) {
      return {
        success: false,
        error: `Template "${templateName}" not found`,
      };
    }

    // Render React component to HTML (await the Promise)
    const html = await render(TemplateComponent(templateData));

    // Ensure html is a string
    if (typeof html !== 'string') {
      return {
        success: false,
        error: `Email render returned ${typeof html} instead of string`,
      };
    }

    return {
      success: true,
      html,
    };
  } catch (error) {
    console.error('Email render error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown render error',
    };
  }
}

/**
 * Generate subject line based on alert type or email type
 */
export function generateSubject(alertType: string, competitorName?: string): string {
  const subjects: Record<string, string> = {
    price_change: `💰 Price changes at ${competitorName}`,
    new_promotion: `🎉 New promotion at ${competitorName}`,
    menu_change: `🍽️ Menu updates at ${competitorName}`,
    welcome: 'Welcome to CompetitorWatch! 🎉',
    trial_day7_reminder: 'Halfway through your trial',
    trial_day11_reminder: 'Your trial ends in 3 days',
    trial_ended: 'Your trial has ended',
    grace_period_ended: 'Your CompetitorWatch access has expired',
  };

  return subjects[alertType] || (competitorName ? `Update at ${competitorName}` : 'CompetitorWatch Update');
}

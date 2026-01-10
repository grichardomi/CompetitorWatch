import { render } from '@react-email/render';
import AlertNotification from '@/emails/alert-notification';

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
      // Add more templates here as needed
    };

    const TemplateComponent = templates[templateName];

    if (!TemplateComponent) {
      return {
        success: false,
        error: `Template "${templateName}" not found`,
      };
    }

    // Render React component to HTML
    const html = render(TemplateComponent(templateData));

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
 * Generate subject line based on alert type
 */
export function generateSubject(alertType: string, competitorName: string): string {
  const subjects: Record<string, string> = {
    price_change: `💰 Price changes at ${competitorName}`,
    new_promotion: `🎉 New promotion at ${competitorName}`,
    menu_change: `🍽️ Menu updates at ${competitorName}`,
  };

  return subjects[alertType] || `Update at ${competitorName}`;
}

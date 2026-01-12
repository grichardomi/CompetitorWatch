import { Resend } from 'resend';
import { EMAIL_CONFIG } from '@/lib/config/env';

let resend: Resend | null = null;

if (process.env.RESEND_API_KEY) {
  resend = new Resend(process.env.RESEND_API_KEY);
} else if (process.env.NODE_ENV === 'production') {
  throw new Error('RESEND_API_KEY environment variable is required in production');
}

export async function sendEmail({
  to,
  subject,
  html,
  from = EMAIL_CONFIG.from,
}: {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
}) {
  // In development without API key, log the email instead of sending
  if (!resend) {
    console.log('[DEV MODE] Email would be sent:');
    console.log(`  To: ${Array.isArray(to) ? to.join(', ') : to}`);
    console.log(`  From: ${from}`);
    console.log(`  Subject: ${subject}`);
    console.log(`  HTML:\n${html}\n`);
    return { id: 'dev-' + Date.now() };
  }

  try {
    const result = await resend.emails.send({
      from,
      to,
      subject,
      html,
    });

    if (result.error) {
      throw new Error(result.error.message);
    }

    return result.data;
  } catch (error) {
    console.error('Email sending error:', error);
    throw error;
  }
}

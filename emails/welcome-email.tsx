import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components';

interface WelcomeEmailProps {
  userName?: string;
  trialEndDate?: string;
  dashboardUrl?: string;
}

export default function WelcomeEmail({
  userName = 'there',
  trialEndDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
  dashboardUrl = 'https://app.competitorwatch.com/dashboard',
}: WelcomeEmailProps) {
  const formattedDate = new Date(trialEndDate).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <Html>
      <Head />
      <Preview>Welcome to CompetitorWatch - Your 14-day trial has started!</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Heading style={h1}>Welcome to CompetitorWatch!</Heading>
          </Section>

          <Section style={content}>
            <Text style={paragraph}>Hi {userName},</Text>

            <Text style={paragraph}>
              Thank you for signing up for CompetitorWatch! Your 14-day free trial has started, and
              you now have access to all features to monitor your competitors.
            </Text>

            <Text style={paragraph}>
              Your trial ends on <strong>{formattedDate}</strong>. You can upgrade anytime to
              continue monitoring after your trial.
            </Text>

            <Section style={quickStart}>
              <Heading style={h2}>Quick Start Guide</Heading>
              <Text style={stepText}>
                <strong>1. Add competitors</strong> - Track up to 5 competitors during your trial
              </Text>
              <Text style={stepText}>
                <strong>2. Configure alerts</strong> - Get notified of price changes and promotions
              </Text>
              <Text style={stepText}>
                <strong>3. Review insights</strong> - Check your dashboard for competitive
                intelligence
              </Text>
            </Section>

            <Button style={button} href={dashboardUrl}>
              Go to Dashboard
            </Button>

            <Text style={paragraph}>
              Need help getting started? Check out our{' '}
              <Link href={`${dashboardUrl.replace('/dashboard', '')}/docs`} style={link}>
                documentation
              </Link>{' '}
              or reply to this email with any questions.
            </Text>
          </Section>

          <Section style={footer}>
            <Text style={footerText}>
              CompetitorWatch - Stay ahead of your competition
            </Text>
            <Link href={`${dashboardUrl}/settings`} style={link}>
              Notification Settings
            </Link>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
  maxWidth: '600px',
};

const header = {
  padding: '32px 20px',
  textAlign: 'center' as const,
};

const h1 = {
  color: '#2563eb',
  fontSize: '32px',
  fontWeight: 'bold',
  margin: '0',
  padding: '0',
};

const h2 = {
  color: '#1e293b',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '24px 0 16px',
};

const content = {
  padding: '0 48px',
};

const paragraph = {
  color: '#525f7f',
  fontSize: '16px',
  lineHeight: '24px',
  textAlign: 'left' as const,
  marginBottom: '16px',
};

const quickStart = {
  backgroundColor: '#f8fafc',
  borderRadius: '8px',
  padding: '24px',
  margin: '24px 0',
};

const stepText = {
  color: '#334155',
  fontSize: '15px',
  lineHeight: '24px',
  marginBottom: '12px',
};

const button = {
  backgroundColor: '#2563eb',
  borderRadius: '8px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'block',
  width: '100%',
  padding: '14px 20px',
  margin: '24px 0',
};

const footer = {
  padding: '24px 48px',
  textAlign: 'center' as const,
  borderTop: '1px solid #e2e8f0',
  marginTop: '32px',
};

const footerText = {
  color: '#94a3b8',
  fontSize: '14px',
  marginBottom: '8px',
};

const link = {
  color: '#2563eb',
  textDecoration: 'underline',
};

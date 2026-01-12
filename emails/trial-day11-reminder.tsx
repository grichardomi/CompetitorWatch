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

interface TrialDay11ReminderProps {
  userName?: string;
  dashboardUrl?: string;
  pricingUrl?: string;
}

export default function TrialDay11Reminder({
  userName = 'there',
  dashboardUrl = 'https://app.marketpulse.com/dashboard',
  pricingUrl = 'https://app.marketpulse.com/pricing',
}: TrialDay11ReminderProps) {
  return (
    <Html>
      <Head />
      <Preview>Your trial ends in 3 days - Upgrade to continue monitoring</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Heading style={h1}>⏰ Your trial ends in 3 days</Heading>
          </Section>

          <Section style={content}>
            <Text style={paragraph}>Hi {userName},</Text>

            <Text style={paragraph}>
              Your MarketPulse free trial is coming to an end soon. You have <strong>3 days
              remaining</strong> to explore all features and monitor your competitors.
            </Text>

            <Section style={warningBox}>
              <Text style={warningText}>
                <strong>Don't lose your competitive advantage!</strong>
              </Text>
              <Text style={warningText}>
                Upgrade now to continue monitoring competitors, receiving real-time alerts, and
                staying ahead of the market.
              </Text>
            </Section>

            <Section style={plansBox}>
              <Heading style={h2}>Choose your plan</Heading>

              <div style={planCard}>
                <Text style={planName}>Starter - $49/month</Text>
                <Text style={planFeature}>• 5 competitors</Text>
                <Text style={planFeature}>• Daily tracking</Text>
                <Text style={planFeature}>• Email alerts</Text>
              </div>

              <div style={planCard}>
                <Text style={planName}>Professional - $99/month</Text>
                <Text style={planFeature}>• 20 competitors</Text>
                <Text style={planFeature}>• Twice-daily tracking</Text>
                <Text style={planFeature}>• Email + SMS alerts</Text>
                <Text style={planFeature}>• Webhooks</Text>
              </div>

              <div style={planCard}>
                <Text style={planName}>Enterprise - $299/month</Text>
                <Text style={planFeature}>• Unlimited competitors</Text>
                <Text style={planFeature}>• Hourly tracking</Text>
                <Text style={planFeature}>• API access</Text>
                <Text style={planFeature}>• Priority support</Text>
              </div>
            </Section>

            <Button style={button} href={`${dashboardUrl}/billing`}>
              Upgrade Now
            </Button>

            <Text style={paragraph}>
              Questions about pricing?{' '}
              <Link href={pricingUrl} style={link}>
                View full pricing details
              </Link>
              {' '}or reply to this email.
            </Text>
          </Section>

          <Section style={footer}>
            <Text style={footerText}>MarketPulse</Text>
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
  color: '#dc2626',
  fontSize: '28px',
  fontWeight: 'bold',
  margin: '0',
};

const h2 = {
  color: '#1e293b',
  fontSize: '22px',
  fontWeight: 'bold',
  margin: '0 0 16px',
  textAlign: 'center' as const,
};

const content = {
  padding: '0 48px',
};

const paragraph = {
  color: '#525f7f',
  fontSize: '16px',
  lineHeight: '24px',
  marginBottom: '16px',
};

const warningBox = {
  backgroundColor: '#fef2f2',
  borderRadius: '8px',
  borderLeft: '4px solid #dc2626',
  padding: '20px',
  margin: '24px 0',
};

const warningText = {
  color: '#991b1b',
  fontSize: '15px',
  lineHeight: '22px',
  marginBottom: '8px',
};

const plansBox = {
  margin: '32px 0',
};

const planCard = {
  backgroundColor: '#f8fafc',
  borderRadius: '8px',
  padding: '20px',
  marginBottom: '16px',
  border: '1px solid #e2e8f0',
};

const planName = {
  color: '#1e293b',
  fontSize: '18px',
  fontWeight: 'bold',
  marginBottom: '12px',
};

const planFeature = {
  color: '#475569',
  fontSize: '14px',
  lineHeight: '20px',
  marginBottom: '4px',
};

const button = {
  backgroundColor: '#dc2626',
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

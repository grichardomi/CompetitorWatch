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

interface TrialDay7ReminderProps {
  userName?: string;
  dashboardUrl?: string;
  competitorsCount?: number;
}

export default function TrialDay7Reminder({
  userName = 'there',
  dashboardUrl = 'http://localhost:3000/dashboard',
  competitorsCount = 0,
}: TrialDay7ReminderProps) {
  return (
    <Html>
      <Head />
      <Preview>You're halfway through your CompetitorWatch trial!</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Heading style={h1}>Halfway through your trial!</Heading>
          </Section>

          <Section style={content}>
            <Text style={paragraph}>Hi {userName},</Text>

            <Text style={paragraph}>
              You're 7 days into your 14-day free trial of CompetitorWatch. Here's a quick update
              on your competitive intelligence journey:
            </Text>

            <Section style={statsBox}>
              <Text style={statText}>
                <strong style={statNumber}>{competitorsCount}</strong> competitors monitored
              </Text>
              <Text style={statText}>
                <strong style={statNumber}>7</strong> days remaining in trial
              </Text>
            </Section>

            <Section style={tipsBox}>
              <Heading style={h2}>Make the most of your trial</Heading>
              <Text style={tipText}>
                ✅ <strong>Add more competitors</strong> - Monitor up to 5 during your trial
              </Text>
              <Text style={tipText}>
                ✅ <strong>Set up alerts</strong> - Get instant notifications for price changes
              </Text>
              <Text style={tipText}>
                ✅ <strong>Check insights daily</strong> - Review your competitive dashboard
              </Text>
            </Section>

            <Button style={button} href={dashboardUrl}>
              View Dashboard
            </Button>

            <Text style={paragraph}>
              Questions or need help? Just reply to this email and we'll be happy to assist you.
            </Text>
          </Section>

          <Section style={footer}>
            <Text style={footerText}>CompetitorWatch</Text>
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
  fontSize: '28px',
  fontWeight: 'bold',
  margin: '0',
};

const h2 = {
  color: '#1e293b',
  fontSize: '20px',
  fontWeight: 'bold',
  margin: '0 0 16px',
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

const statsBox = {
  backgroundColor: '#eff6ff',
  borderRadius: '8px',
  padding: '24px',
  margin: '24px 0',
  textAlign: 'center' as const,
};

const statText = {
  color: '#1e40af',
  fontSize: '16px',
  margin: '12px 0',
};

const statNumber = {
  fontSize: '32px',
  fontWeight: 'bold',
  display: 'block',
};

const tipsBox = {
  backgroundColor: '#f0fdf4',
  borderRadius: '8px',
  padding: '24px',
  margin: '24px 0',
};

const tipText = {
  color: '#166534',
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

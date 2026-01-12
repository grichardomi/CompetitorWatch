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

interface TrialEndedProps {
  userName?: string;
  dashboardUrl?: string;
  gracePeriodDays?: number;
}

export default function TrialEnded({
  userName = 'there',
  dashboardUrl = 'https://app.marketpulse.com/dashboard',
  gracePeriodDays = 3,
}: TrialEndedProps) {
  return (
    <Html>
      <Head />
      <Preview>Your MarketPulse trial has ended</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Heading style={h1}>Your trial has ended</Heading>
          </Section>

          <Section style={content}>
            <Text style={paragraph}>Hi {userName},</Text>

            <Text style={paragraph}>
              Your 14-day free trial of MarketPulse has come to an end. We hope you enjoyed
              exploring our competitive intelligence platform!
            </Text>

            <Section style={gracePeriodBox}>
              <Text style={gracePeriodTitle}>
                🎁 You have {gracePeriodDays} days of grace period
              </Text>
              <Text style={gracePeriodText}>
                During this time, you can still view all your competitor data and insights. However,
                you won't be able to add new competitors or trigger new crawls until you upgrade.
              </Text>
            </Section>

            <Section style={thankYouBox}>
              <Text style={thankYouText}>
                Thank you for trying MarketPulse. We'd love to continue helping you stay ahead
                of your competition.
              </Text>
            </Section>

            <Text style={paragraph}>
              <strong>To continue monitoring your competitors:</strong>
            </Text>

            <Text style={paragraph}>
              Choose a plan that fits your needs and never miss another competitive update. All your
              data is saved and will be available immediately after you upgrade.
            </Text>

            <Button style={button} href={`${dashboardUrl}/billing`}>
              Choose Your Plan
            </Button>

            <Section style={benefitsBox}>
              <Heading style={h2}>Why upgrade?</Heading>
              <Text style={benefitText}>
                ✓ <strong>Stay informed</strong> - Get instant alerts on competitor changes
              </Text>
              <Text style={benefitText}>
                ✓ <strong>Save time</strong> - Automated monitoring instead of manual checking
              </Text>
              <Text style={benefitText}>
                ✓ <strong>Make better decisions</strong> - Data-driven competitive insights
              </Text>
              <Text style={benefitText}>
                ✓ <strong>Grow faster</strong> - React quickly to market opportunities
              </Text>
            </Section>

            <Text style={paragraph}>
              Have questions? Just reply to this email and we'll help you choose the right plan.
            </Text>

            <Text style={paragraphSmall}>
              Not ready to upgrade? Your account will remain active, but monitoring will be paused.
              You can upgrade anytime to resume.
            </Text>
          </Section>

          <Section style={footer}>
            <Text style={footerText}>
              Thank you for trying MarketPulse
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
  color: '#475569',
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

const paragraphSmall = {
  color: '#94a3b8',
  fontSize: '14px',
  lineHeight: '20px',
  marginTop: '24px',
};

const gracePeriodBox = {
  backgroundColor: '#fef3c7',
  borderRadius: '8px',
  padding: '24px',
  margin: '24px 0',
  borderLeft: '4px solid #f59e0b',
};

const gracePeriodTitle = {
  color: '#92400e',
  fontSize: '18px',
  fontWeight: 'bold' as const,
  lineHeight: '24px',
  margin: '0 0 12px',
};

const gracePeriodText = {
  color: '#78350f',
  fontSize: '15px',
  lineHeight: '22px',
  margin: '0',
};

const thankYouBox = {
  backgroundColor: '#f0f9ff',
  borderRadius: '8px',
  padding: '24px',
  margin: '24px 0',
  borderLeft: '4px solid #2563eb',
};

const thankYouText = {
  color: '#1e40af',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '0',
};

const benefitsBox = {
  backgroundColor: '#f8fafc',
  borderRadius: '8px',
  padding: '24px',
  margin: '24px 0',
};

const benefitText = {
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

'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';

interface HelpContent {
  [key: string]: {
    title: string;
    category: string;
    icon: string;
    content: string;
    relatedArticles: { id: string; title: string }[];
  };
}

const helpContent: HelpContent = {
  'getting-started': {
    title: 'Getting Started',
    category: 'Basics',
    icon: '🚀',
    content: `
# Getting Started with MarketPulse

Welcome to MarketPulse! This guide will help you get up and running quickly.

## Step 1: Create Your Account

1. Sign up using your email or Google account
2. Verify your email address
3. Complete your business profile

## Step 2: Add Your First Competitor

1. Navigate to the Competitors page
2. Click "Add Competitor"
3. Enter the competitor's website URL
4. Configure monitoring settings

## Step 3: Set Up Alerts

Your competitors are now being monitored automatically. You'll receive alerts when:
- Prices change
- New promotions are detected
- Menu or product changes occur

## Next Steps

- Customize your notification preferences
- Add more competitors
- Review your dashboard regularly

Need more help? [Contact our support team](/contact)
    `,
    relatedArticles: [
      { id: 'adding-competitors', title: 'Adding Competitors' },
      { id: 'understanding-alerts', title: 'Understanding Alerts' },
    ],
  },
  'adding-competitors': {
    title: 'Adding Competitors',
    category: 'Basics',
    icon: '👥',
    content: `
# Adding Competitors

Learn how to add and monitor your competitors effectively.

## How to Add a Competitor

1. **Navigate to Competitors page**
   - Click "Competitors" in the main navigation

2. **Click "Add Competitor" button**
   - Located in the top right corner

3. **Enter competitor details**
   - Business name
   - Website URL (must be a valid URL)
   - Industry/category

4. **Configure monitoring settings**
   - Crawl frequency (how often to check for changes)
   - Enable/disable specific alert types

## Best Practices

- Start with 3-5 main competitors
- Use accurate website URLs
- Enable alerts for changes that matter to your business
- Review competitor data weekly

## Competitor Limits

Your plan determines how many competitors you can monitor:
- **Starter**: 5 competitors
- **Professional**: 15 competitors
- **Enterprise**: Unlimited

[Upgrade your plan](/dashboard/billing) to monitor more competitors.
    `,
    relatedArticles: [
      { id: 'getting-started', title: 'Getting Started' },
      { id: 'price-tracking', title: 'Price Tracking' },
    ],
  },
  'understanding-alerts': {
    title: 'Understanding Alerts',
    category: 'Features',
    icon: '🔔',
    content: `
# Understanding Alerts

MarketPulse monitors your competitors and sends you alerts when changes are detected.

## Alert Types

### Price Change Alerts 💰
Triggered when competitor prices change by more than your threshold.

### New Promotion Alerts 🎉
Notifies you when competitors launch new promotions or sales.

### Menu/Product Change Alerts 📋
Alerts you to changes in competitor offerings or menu items.

## Managing Alerts

### Viewing Alerts
- Go to the Alerts page
- Filter by type, competitor, or date
- Mark alerts as read

### Alert Settings
Configure which alerts you receive:
1. Go to Settings
2. Navigate to Notifications
3. Enable/disable specific alert types
4. Set notification channels (email, in-app)

## Alert Filters

Use filters to find specific alerts:
- **By Type**: Filter by alert category
- **By Competitor**: View alerts from specific competitors
- **By Status**: Show read or unread alerts
- **By Date**: View alerts from a specific time period

[Learn more about notification settings](/help/notification-settings)
    `,
    relatedArticles: [
      { id: 'notification-settings', title: 'Notification Settings' },
      { id: 'price-tracking', title: 'Price Tracking' },
    ],
  },
  'managing-subscription': {
    title: 'Managing Your Subscription',
    category: 'Billing',
    icon: '💳',
    content: `
# Managing Your Subscription

Everything you need to know about billing and subscriptions.

## Subscription Plans

### Starter Plan - $49/month
- Monitor up to 5 competitors
- Daily price tracking
- Email alerts
- 7-day data history

### Professional Plan - $99/month
- Monitor up to 15 competitors
- Hourly price tracking
- Email + in-app alerts
- 30-day data history
- Priority support

### Enterprise Plan - $299/month
- Unlimited competitors
- Real-time tracking
- Advanced analytics
- 1-year data history
- Dedicated account manager

## How to Upgrade

1. Go to [Billing page](/dashboard/billing)
2. Click "Upgrade Plan"
3. Select your desired plan
4. Complete payment

## How to Cancel

1. Go to [Billing page](/dashboard/billing)
2. Click "Manage Subscription"
3. Select "Cancel Subscription"
4. Confirm cancellation

Your service will continue until the end of your billing period.

## Payment Methods

We accept:
- Credit cards (Visa, Mastercard, Amex)
- Debit cards
- ACH transfers (Enterprise only)

All payments are processed securely through Stripe.

## Refund Policy

- 14-day money-back guarantee
- No questions asked
- Contact support for refund requests

Need help? [Contact our billing team](/contact)
    `,
    relatedArticles: [
      { id: 'getting-started', title: 'Getting Started' },
      { id: 'troubleshooting', title: 'Troubleshooting' },
    ],
  },
  'price-tracking': {
    title: 'Price Tracking',
    category: 'Features',
    icon: '💰',
    content: `
# Price Tracking

Learn how our price monitoring system works.

## How It Works

MarketPulse automatically crawls your competitors' websites and detects price changes:

1. **Automatic Crawling**
   - Scheduled based on your plan
   - Checks product pages for price updates

2. **Change Detection**
   - Compares current prices to previous snapshots
   - Calculates percentage changes

3. **Alert Generation**
   - Creates alerts when prices change beyond threshold
   - Sends notifications via your preferred channels

## Price History

View historical price data:
- Line charts showing price trends
- Comparison across competitors
- Identify pricing patterns

## Setting Price Alerts

Configure when you want to be notified:
1. Go to Competitor settings
2. Set price change threshold (e.g., 5%)
3. Enable price change alerts

## Best Practices

- Monitor key competitor products
- Set realistic alert thresholds
- Review price trends weekly
- Adjust your pricing strategy accordingly

[Learn more about alerts](/help/understanding-alerts)
    `,
    relatedArticles: [
      { id: 'understanding-alerts', title: 'Understanding Alerts' },
      { id: 'adding-competitors', title: 'Adding Competitors' },
    ],
  },
  'notification-settings': {
    title: 'Notification Settings',
    category: 'Settings',
    icon: '⚙️',
    content: `
# Notification Settings

Customize how and when you receive alerts.

## Notification Channels

### Email Notifications
- Instant alerts for critical changes
- Daily digest summaries
- Weekly reports

### In-App Notifications
- Real-time alerts in dashboard
- Badge counters for unread alerts
- Push notifications (coming soon)

## Configuring Notifications

1. Go to [Settings](/dashboard/settings)
2. Navigate to "Notifications"
3. Enable/disable channels
4. Set notification preferences

## Notification Types

You can control notifications for:
- Price changes
- New promotions
- Menu changes
- System updates
- Billing alerts

## Notification Frequency

Choose how often you want to receive alerts:
- **Instant**: As changes are detected
- **Hourly**: Bundled hourly digest
- **Daily**: Once per day summary
- **Weekly**: Weekly report

## Quiet Hours

Set times when you don't want to receive notifications:
1. Enable quiet hours
2. Set start and end times
3. Choose days of week

During quiet hours, alerts are still generated but notifications are delayed.

## Unsubscribe

You can unsubscribe from specific alert types at any time without affecting your account.

[Contact support](/contact) if you need help with notification settings.
    `,
    relatedArticles: [
      { id: 'understanding-alerts', title: 'Understanding Alerts' },
      { id: 'account-security', title: 'Account Security' },
    ],
  },
  'troubleshooting': {
    title: 'Troubleshooting',
    category: 'Support',
    icon: '🔧',
    content: `
# Troubleshooting

Common issues and how to resolve them.

## Competitor Not Being Tracked

**Problem**: Competitor was added but no data is showing

**Solutions**:
- Verify the URL is correct and accessible
- Check if the competitor's website is online
- Ensure the website allows crawling
- Wait 24 hours for initial crawl to complete

## Not Receiving Alerts

**Problem**: Changes detected but no alerts received

**Solutions**:
- Check notification settings
- Verify email address is correct
- Check spam/junk folder
- Ensure alert types are enabled

## Login Issues

**Problem**: Unable to log in to account

**Solutions**:
- Reset your password
- Clear browser cache and cookies
- Try a different browser
- Check if email is verified

## Payment Failed

**Problem**: Subscription payment declined

**Solutions**:
- Verify card details are correct
- Check with your bank
- Try a different payment method
- Update billing information

## Slow Dashboard

**Problem**: Dashboard loading slowly

**Solutions**:
- Clear browser cache
- Check internet connection
- Try a different browser
- Reduce number of active competitors

## Data Not Updating

**Problem**: Competitor data seems outdated

**Solutions**:
- Check last crawl time
- Verify competitor is active
- Check crawl frequency settings
- Contact support if issue persists

## Still Having Issues?

If these solutions don't help:
1. [Contact our support team](/contact)
2. Include detailed description of the issue
3. Provide screenshots if applicable
4. Mention your account email

We typically respond within 24 hours.
    `,
    relatedArticles: [
      { id: 'getting-started', title: 'Getting Started' },
      { id: 'account-security', title: 'Account Security' },
    ],
  },
  'account-security': {
    title: 'Account Security',
    category: 'Security',
    icon: '🔒',
    content: `
# Account Security

Keep your MarketPulse account safe and secure.

## Password Best Practices

- Use a strong, unique password
- Minimum 8 characters
- Include uppercase, lowercase, numbers, and symbols
- Don't reuse passwords from other sites
- Change password every 6 months

## Two-Factor Authentication (2FA)

Enable 2FA for extra security:
1. Go to [Security Settings](/dashboard/security)
2. Click "Enable 2FA"
3. Scan QR code with authenticator app
4. Enter verification code

## Sign-Out Security

- Always sign out on shared devices
- Use "Stay signed in" only on personal devices
- Review active sessions regularly

## Suspicious Activity

If you notice unusual activity:
1. Change your password immediately
2. Sign out of all devices
3. Contact support
4. Review recent alerts and changes

## Account Recovery

If you lose access:
1. Use "Forgot Password" on login page
2. Check email for reset link
3. Create a new password
4. Contact support if email not received

## Data Privacy

Your data is protected:
- Encrypted connections (SSL/TLS)
- Secure data storage
- No sharing with third parties
- GDPR compliant

## Account Deletion

To delete your account:
1. Go to [Account Settings](/dashboard/account/delete)
2. Click "Delete Account"
3. Confirm deletion
4. All data will be permanently removed

**Note**: This action cannot be undone.

Read our [Privacy Policy](/privacy) for more information.
    `,
    relatedArticles: [
      { id: 'troubleshooting', title: 'Troubleshooting' },
      { id: 'managing-subscription', title: 'Managing Subscription' },
    ],
  },
};

export default function HelpArticlePage() {
  const params = useParams();
  const slug = params.slug as string;
  const article = helpContent[slug];

  if (!article) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="text-6xl mb-4">❓</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Article Not Found</h1>
          <p className="text-gray-600 mb-6">
            The help article you&apos;re looking for doesn&apos;t exist.
          </p>
          <Link
            href="/help"
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Help Center
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 sm:px-6 py-4">
          <Link href="/" className="text-xl font-bold text-blue-600">
            MarketPulse
          </Link>
        </div>
      </header>

      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 sm:px-6 py-3">
          <div className="flex items-center gap-2 text-sm">
            <Link href="/help" className="text-blue-600 hover:underline">
              Help Center
            </Link>
            <span className="text-gray-400">/</span>
            <span className="text-gray-900">{article.title}</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-4 sm:px-6 py-8 md:py-12">
        <div className="max-w-4xl mx-auto">
          {/* Article Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-5xl">{article.icon}</span>
              <div>
                <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium mb-2">
                  {article.category}
                </span>
                <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
                  {article.title}
                </h1>
              </div>
            </div>
          </div>

          {/* Article Content */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 md:p-8 mb-8">
            <div
              className="prose prose-blue max-w-none"
              style={{
                whiteSpace: 'pre-wrap',
                lineHeight: '1.8',
              }}
            >
              {article.content}
            </div>
          </div>

          {/* Related Articles */}
          {article.relatedArticles.length > 0 && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Related Articles
              </h2>
              <div className="space-y-2">
                {article.relatedArticles.map((related) => (
                  <Link
                    key={related.id}
                    href={`/help/${related.id}`}
                    className="block p-3 rounded-lg hover:bg-gray-50 transition-colors text-blue-600 hover:underline"
                  >
                    {related.title} →
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Contact Support */}
          <div className="mt-8 text-center">
            <p className="text-gray-600 mb-4">Was this article helpful?</p>
            <Link
              href="/contact"
              className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Contact Support
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}

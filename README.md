# MarketPulse - Competitive Intelligence SaaS Platform

A modern SaaS platform for monitoring competitor pricing, promotions, and service changes in real-time. Built with Next.js 15, TypeScript, Prisma, and PostgreSQL.

## 🌟 Features

- **Real-Time Competitor Monitoring**: Track competitor websites and detect price changes, promotions, and menu updates
- **AI-Powered Data Extraction**: Claude AI automatically extracts and analyzes competitor data
- **Mobile-First Design**: Fully responsive interface optimized for phones, tablets, and desktops
- **Email Notifications**: Customizable alert frequency (instant, hourly, daily, weekly)
- **SMS Alerts**: Premium tier SMS notifications via Twilio
- **Webhook Integration**: Send alerts to Slack, custom apps, or your own endpoints
- **Trial & Billing**: 14-day free trial with Stripe subscription management
- **Dashboard**: Real-time alerts feed, competitor status, and analytics
- **User Management**: Email magic links + Google OAuth authentication

## 🛠️ Tech Stack

### Frontend
- **Next.js 15** with App Router
- **React 19** with TypeScript
- **Tailwind CSS** (mobile-first)
- **shadcn/ui** components (pre-built)
- **Zustand** for state management
- **React Email** for email templates

### Backend & Database
- **Next.js API Routes** (REST)
- **TypeScript** (strict mode)
- **Prisma ORM** with PostgreSQL
- **NextAuth.js** for authentication

### Services & Integrations
- **Stripe** - Subscriptions & billing
- **Resend** - Email delivery
- **Twilio** - SMS notifications
- **Anthropic Claude API** - AI data extraction
- **Playwright** - Web crawler
- **Railway** - Hosting & deployment

## 📋 Prerequisites

- Node.js 18+ (or 20+)
- PostgreSQL 14+ database
- Stripe account
- Resend API key
- Anthropic Claude API key
- Google OAuth credentials (optional)
- Twilio account (optional, for SMS)

## 🚀 Quick Start

### 1. Clone & Install Dependencies

```bash
git clone <repository-url>
cd competitor-watch
npm install
# or
pnpm install
# or
yarn install
```

### 2. Setup Environment Variables

```bash
cp .env.example .env.local
```

Edit `.env.local` and fill in all required variables:

#### **Database**
```env
DATABASE_URL="postgresql://user:password@localhost:5432/competitor_watch"
```

#### **NextAuth.js** (Required)
```env
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here-min-32-chars-very-important"
```

Generate a secure `NEXTAUTH_SECRET`:
```bash
openssl rand -base64 32
```

#### **Google OAuth** (Optional but Recommended)
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project
3. Enable Google+ API
4. Create OAuth 2.0 credentials (Web application)
5. Add authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google` (development)
   - `https://your-domain.com/api/auth/callback/google` (production)

```env
GOOGLE_CLIENT_ID="your-google-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
```

#### **Stripe** (Required for Billing)
1. Sign up at [Stripe](https://stripe.com)
2. Get API keys from Dashboard → Developers
3. Create products and prices for each tier:
   - **Starter**: $49/month, 5 competitors
   - **Pro**: $99/month, 20 competitors
   - **Enterprise**: $299/month, 100 competitors

```env
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_test_..."
STRIPE_STARTER_PRICE_ID="price_..."
STRIPE_PRO_PRICE_ID="price_..."
STRIPE_ENTERPRISE_PRICE_ID="price_..."
```

#### **Resend** (Required for Email)
1. Sign up at [Resend](https://resend.com)
2. Get API key from Dashboard

```env
RESEND_API_KEY="re_..."
```

#### **Anthropic Claude** (Required for AI Extraction)
1. Sign up at [Anthropic Console](https://console.anthropic.com)
2. Create API key

```env
ANTHROPIC_API_KEY="sk-ant-..."
```

#### **Twilio** (Optional, for SMS)
1. Sign up at [Twilio](https://www.twilio.com)
2. Get Account SID and Auth Token
3. Get a phone number

```env
TWILIO_ACCOUNT_SID="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
TWILIO_AUTH_TOKEN="your-auth-token"
TWILIO_PHONE_NUMBER="+1234567890"
```

### 3. Setup Database

```bash
# Push schema to database (creates tables)
npm run db:push

# (Optional) Open Prisma Studio to view data
npm run db:studio
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📁 Project Structure

```
/
├── app/                          # Next.js App Router
│   ├── /auth                     # Authentication pages
│   ├── /onboarding               # 3-step onboarding wizard
│   ├── /dashboard                # Main app dashboard
│   ├── /api                      # REST API routes
│   ├── /pricing                  # Pricing page
│   ├── /(marketing)              # Marketing pages
│   ├── layout.tsx                # Root layout
│   ├── page.tsx                  # Home page
│   └── globals.css               # Global styles
│
├── lib/                          # Core utilities
│   ├── /auth                     # Authentication logic
│   ├── /db                       # Database queries
│   ├── /stripe                   # Stripe helpers
│   ├── /email                    # Email service
│   ├── /sms                      # SMS service
│   ├── /webhooks                 # Webhook helpers
│   ├── /billing                  # Billing logic
│   ├── /queue                    # Job queue helpers
│   └── /utils                    # General utilities
│
├── components/                   # Reusable React components
│   ├── /ui                       # shadcn/ui components
│   ├── /dashboard                # Dashboard components
│   ├── /billing                  # Billing components
│   ├── /webhooks                 # Webhook components
│   └── /notifications            # Notification components
│
├── emails/                       # React Email templates
│   ├── /auth                     # Auth emails
│   ├── /alerts                   # Alert emails
│   └── /billing                  # Billing emails
│
├── services/                     # Background services
│   ├── /crawler                  # Website crawler (Playwright)
│   ├── /scheduler                # Job scheduler
│   ├── /email-worker             # Email queue processor
│   └── /webhook-retrier          # Webhook retry logic
│
├── prisma/
│   └── schema.prisma             # Database schema
│
├── public/                       # Static assets
├── types/                        # TypeScript types
│
├── .env.example                  # Environment variables template
├── .eslintrc.json                # ESLint config
├── .prettierrc                   # Prettier config
├── .husky/                       # Git hooks
├── tsconfig.json                 # TypeScript config
├── tailwind.config.ts            # Tailwind config
├── next.config.js                # Next.js config
└── package.json                  # Dependencies
```

## 🔑 Key Features Implementation

### Authentication
- Email magic links (passwordless)
- Google OAuth 2.0
- NextAuth.js session management
- Protected API routes and pages

### Onboarding Flow
1. User signs up → Trial auto-created (14 days)
2. 3-step wizard:
   - Step 1: Business info (name, location)
   - Step 2: Add first competitor (URL)
   - Step 3: Notification preferences
3. Welcome email sent
4. Access to dashboard granted

### Competitor Monitoring
- Add/manage competitors via dashboard
- Automatic crawling every 12 hours
- Manual trigger available anytime
- Content change detection (hash-based)
- Price, promotion, and menu tracking

### AI Data Extraction
- Claude API integration for intelligent HTML parsing
- Extracts: prices, promotions, menu items
- Caching for optimization (avoid re-processing identical content)
- Change detection and alerting

### Notifications
- Email: instant, hourly, daily, weekly digests
- SMS: premium feature (Twilio)
- Webhooks: Slack, custom endpoints (HMAC signed)
- Quiet hours support (timezone-aware)
- Alert type filtering

### Billing
- Stripe subscriptions
- 14-day free trial (auto-activated)
- 3 pricing tiers: Starter ($49), Pro ($99), Enterprise ($299)
- Usage enforcement (competitor limits)
- Self-service portal (manage subscriptions)
- Webhook handling for payment events

## 🔄 Mobile-First Design

All components follow a mobile-first design approach:

```tsx
// Example: Mobile-first responsive component
<div className="
  p-4 sm:p-6                    // Padding: 1rem mobile, 1.5rem+ tablet
  flex flex-col sm:flex-row     // Stack mobile, inline tablet+
  gap-2 sm:gap-4               // Spacing scale
  text-sm sm:text-base         // Text size scale
">
  Content here
</div>
```

### Tailwind Breakpoints
- **Default (mobile)**: < 640px
- **sm**: ≥ 640px (tablets)
- **md**: ≥ 768px (small desktops)
- **lg**: ≥ 1024px (desktops)
- **xl**: ≥ 1280px (large desktops)

## 📧 Email Templates

Located in `/emails`:

- **Welcome.tsx** - Initial welcome email
- **Magic Link Auth** - Passwordless login
- **Onboarding Reminder** - Reminder if not completed
- **Trial Midpoint** (Day 7)
- **Trial Ending Soon** (Day 11)
- **Trial Ended** (Day 14)
- **Price Change Alert** - Competitor price updates
- **Promotion Alert** - New promotions detected
- **Daily Digest** - Daily summary of changes
- **Payment Failed** - Subscription payment issues
- **Subscription Renewed** - Successful renewal

## 🎯 API Endpoints

### Authentication
- `POST /api/auth/signin` - Sign in
- `POST /api/auth/signout` - Sign out
- `GET /api/auth/session` - Current session

### Competitors
- `GET /api/competitors` - List competitors
- `POST /api/competitors` - Create competitor
- `PUT /api/competitors/[id]` - Update competitor
- `DELETE /api/competitors/[id]` - Delete competitor

### Crawling
- `POST /api/crawl/trigger` - Manual crawl
- `GET /api/crawl/status` - Crawl status

### Alerts
- `GET /api/alerts` - List alerts
- `PUT /api/alerts/[id]` - Mark as read
- `DELETE /api/alerts/[id]` - Delete alert

### Billing
- `POST /api/billing/checkout` - Create checkout session
- `GET /api/billing/portal` - Customer portal
- `GET /api/billing/plans` - Available plans
- `POST /api/webhooks/stripe` - Webhook handler

### Notifications
- `GET /api/notifications/preferences` - Get settings
- `PUT /api/notifications/preferences` - Update settings
- `POST /api/notifications/test-email` - Test email
- `POST /api/notifications/verify-sms` - Verify SMS

### Webhooks
- `GET /api/webhooks` - List webhooks
- `POST /api/webhooks` - Create webhook
- `PUT /api/webhooks/[id]` - Update webhook
- `DELETE /api/webhooks/[id]` - Delete webhook
- `POST /api/webhooks/test` - Test webhook

## 🚀 Deployment

### Railway Deployment

1. **Create Railway Project**
   - Sign up at [Railway](https://railway.app)
   - Create new project

2. **Add PostgreSQL Database**
   - Add PostgreSQL plugin
   - Copy `DATABASE_URL`

3. **Deploy Next.js App**
   - Connect GitHub repository
   - Set environment variables
   - Deploy

4. **Setup Stripe Webhook** (Production)
   - Go to Stripe Dashboard → Webhooks
   - Add endpoint: `https://your-domain.com/api/webhooks/stripe`
   - Select events: subscription, payment_intent

5. **Enable Background Services**
   - Crawler worker (Node.js)
   - Scheduler service (Node.js)
   - Email worker (Node.js)

See [ARCHITECTURE.md](./ARCHITECTURE.md) for detailed deployment architecture.

## 📊 Cost Estimates

### MVP (10-50 customers)
- **Total**: ~$55-155/month
- **Revenue** (50 @ $50): $2,500/month
- **Profit**: 94-97%

### Growth (500 customers)
- **Total**: ~$980-1,160/month
- **Revenue** (500 @ $50): $25,000/month
- **Profit**: 95-96%

## 🛠️ Development Commands

```bash
# Install dependencies
npm install

# Development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint

# Database operations
npm run db:push      # Push schema changes
npm run db:generate  # Regenerate Prisma client
npm run db:studio    # Open Prisma Studio
npm run db:seed      # Run seed script

# Type checking
npx tsc --noEmit
```

## 🧪 Testing

```bash
# Run tests (setup test configuration in jest.config.js)
npm run test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage
```

## 📚 Key Design Patterns

### API Response Format
```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
```

### Error Handling
- Try/catch for async operations
- Proper error logging
- User-friendly error messages
- Detailed logs in development

### Database Queries
- Use Prisma for all database access
- Optimize with `select` and `include`
- Pagination for list endpoints
- Proper indexing for performance

## 🔐 Security

- Environment variables for sensitive data
- HTTPS in production
- CSRF protection (Next.js default)
- SQL injection prevention (Prisma)
- XSS protection (React default)
- Rate limiting on API endpoints
- HMAC signature verification for webhooks

## 📖 Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs/)
- [Tailwind CSS](https://tailwindcss.com)
- [NextAuth.js](https://next-auth.js.org)
- [Stripe API](https://stripe.com/docs/api)
- [Resend Email](https://resend.com/docs)
- [Anthropic Claude](https://docs.anthropic.com)

## 📝 License

MIT License - see LICENSE file for details

## 🤝 Contributing

Contributions welcome! Please follow the code style and open a pull request.

---

**Next Steps:**
1. Fill in environment variables in `.env.local`
2. Run `npm run db:push` to create database tables
3. Run `npm run dev` to start development server
4. Navigate to `http://localhost:3000`
5. Implement API routes from [ARCHITECTURE.md](./ARCHITECTURE.md)
# MarketPulse

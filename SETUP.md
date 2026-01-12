# Quick Setup Guide for MarketPulse

This guide will get you up and running in 10 minutes.

## Prerequisites

- Node.js 18+ installed
- PostgreSQL 14+ database (local or Railway)
- Stripe account
- Resend API key
- Anthropic Claude API key
- Google OAuth credentials (optional)

## Step 1: Install Dependencies

```bash
npm install
# or
pnpm install
# or
yarn install
```

This installs all required packages from `package.json`:
- Next.js 15, React 19, TypeScript
- Prisma ORM
- NextAuth.js, Stripe, Resend
- Tailwind CSS and related tools

## Step 2: Setup Environment Variables

Copy the template and fill in your credentials:

```bash
cp .env.example .env.local
```

Open `.env.local` and fill in:

### Required Variables

**Database:**
```
DATABASE_URL="postgresql://user:password@localhost:5432/competitor_watch"
```

**NextAuth (for authentication):**
```
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generate-a-32-char-secret-with: openssl rand -base64 32"
```

**Stripe (for billing):**
- Get from https://dashboard.stripe.com/apikeys
- Create products for each tier and get their Price IDs

**Resend (for email):**
- Get from https://resend.com/api-keys

**Anthropic Claude (for AI extraction):**
- Get from https://console.anthropic.com/account/keys

### Optional Variables

**Google OAuth:**
- Create at https://console.cloud.google.com
- Add redirect URI: `http://localhost:3000/api/auth/callback/google`

**Twilio (for SMS alerts):**
- Create at https://www.twilio.com/console

## Step 3: Setup Database

```bash
# Push Prisma schema to PostgreSQL
npm run db:push
```

This creates all tables:
- Users, Subscriptions, Payments
- Businesses, Competitors, Alerts
- Email/SMS queues, Webhooks
- And more...

Optional: Open Prisma Studio to view/edit data:
```bash
npm run db:studio
```

## Step 4: Run Development Server

```bash
npm run dev
```

Visit http://localhost:3000 in your browser.

## Test The Setup

1. **Homepage**: http://localhost:3000
   - Should display landing page with "Get Started" button

2. **Pricing Page**: http://localhost:3000/pricing
   - Shows 3 pricing tiers (Starter, Pro, Enterprise)

3. **Dashboard** (protected): http://localhost:3000/dashboard
   - Requires authentication (will redirect to sign in)

4. **Health Check**: http://localhost:3000/api/health
   - Should return `{"status":"ok"}`

## Next Steps

### 1. Implement Authentication
- Create `/app/auth/[...nextauth]/route.ts` with NextAuth handlers
- Implement email magic link signing
- Test Google OAuth integration

### 2. Build Dashboard Pages
- `/app/dashboard/competitors` - Competitor management
- `/app/dashboard/alerts` - Alert feed
- `/app/dashboard/settings` - Notification preferences
- `/app/dashboard/settings/billing` - Subscription management

### 3. Build API Routes
Start with critical endpoints:
- `POST /api/auth/signin` - Email magic link
- `POST /api/competitors` - Create competitor
- `GET /api/competitors` - List competitors
- `POST /api/crawl/trigger` - Start web crawler
- `POST /api/billing/checkout` - Stripe checkout

### 4. Setup Email Templates
Create React Email templates in `/emails`:
- `welcome.tsx` - Welcome email
- `magic-link.tsx` - Authentication link
- `price-change-alert.tsx` - Price change notification
- And more (see README.md for full list)

### 5. Implement Crawler Service
- Web crawler using Playwright
- AI extraction using Claude API
- Change detection (hash-based)
- Scheduled jobs for monitoring

## Project Structure Overview

```
/
├── app/                    # Next.js pages & API routes
├── lib/                    # Reusable utilities & functions
├── components/             # React components
├── emails/                 # React Email templates
├── services/               # Background workers
├── prisma/                 # Database schema
├── types/                  # TypeScript types
├── public/                 # Static assets
├── .env.example            # Environment variables template
├── package.json            # Dependencies
├── tsconfig.json           # TypeScript config
├── tailwind.config.ts      # Tailwind CSS config
├── next.config.js          # Next.js config
├── README.md               # Full documentation
└── ARCHITECTURE.md         # System design
```

## Common Issues

### PostgreSQL Connection Error
- Check `DATABASE_URL` is correct
- Ensure PostgreSQL is running
- Verify credentials: `psql -U username -d database_name`

### Prisma Client Error
```bash
npm run db:generate
```

### Module Not Found
```bash
rm -rf node_modules
npm install
```

### Port 3000 Already in Use
```bash
npm run dev -- -p 3001
```

## Key Dependencies

| Package | Purpose |
|---------|---------|
| **next** | React framework with routing |
| **react** | UI library |
| **typescript** | Type safety |
| **prisma** | ORM for PostgreSQL |
| **next-auth** | Authentication |
| **stripe** | Billing & subscriptions |
| **resend** | Email service |
| **tailwindcss** | Styling framework |
| **zod** | Input validation |

## Documentation

- **Full Guide**: See [README.md](./README.md)
- **Architecture**: See [ARCHITECTURE.md](./ARCHITECTURE.md)
- **API Endpoints**: Listed in README.md under "🎯 API Endpoints"
- **Database Schema**: See [prisma/schema.prisma](./prisma/schema.prisma)

## Getting Help

1. Check README.md for detailed documentation
2. Review ARCHITECTURE.md for system design
3. Check `.env.example` for all available variables
4. Consult Prisma docs: https://www.prisma.io/docs/
5. NextAuth docs: https://next-auth.js.org/

## Next Command to Run

After setup, start building features:

```bash
npm run dev
```

Then implement authentication by creating the NextAuth handler in `/app/auth/[...nextauth]/route.ts`.

Happy coding! 🚀

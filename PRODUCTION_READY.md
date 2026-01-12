# Production-Ready Configuration Guide

This document explains how MarketPulse uses environment variables for production-ready, scalable configuration.

## Environment Configuration System

All environment variables are centralized in `/lib/config/env.ts` which provides:

### ✅ Benefits
- **Type-safe** configuration with TypeScript
- **Validated** environment variables on startup
- **Centralized** configuration prevents scattered hardcoded values
- **Environment-specific** settings (development vs production)
- **Helper functions** for common URL patterns

### 🔧 Configuration Files

#### 1. `.env.example`
Template file with all available environment variables. Copy this to `.env.local` and fill in your values.

#### 2. `/lib/config/env.ts`
Centralized configuration module that:
- Loads and validates environment variables
- Provides typed configuration objects
- Includes helper functions
- Throws errors for missing required variables in production

## Required Environment Variables

### Critical (Application Won't Start Without These)
```bash
NEXT_PUBLIC_APP_URL=https://your-domain.com
DATABASE_URL=postgresql://...
NEXTAUTH_SECRET=your-secret-min-32-chars
NEXTAUTH_URL=https://your-domain.com
STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### Stripe Price Configuration
```bash
STRIPE_PRICE_STARTER=price_xxx
STRIPE_PRICE_PROFESSIONAL=price_xxx
STRIPE_PRICE_ENTERPRISE=price_xxx
```

### Plan Limits
```bash
PLAN_STARTER_LIMIT=5
PLAN_PROFESSIONAL_LIMIT=20
PLAN_ENTERPRISE_LIMIT=100
```

### Trial Configuration
```bash
TRIAL_DURATION_DAYS=14
TRIAL_GRACE_PERIOD_DAYS=3
TRIAL_COMPETITOR_LIMIT=3
```

## Usage Examples

### Using Configuration in API Routes

```typescript
import { STRIPE_CONFIG, getDashboardUrl } from '@/lib/config/env';

// Get Stripe price IDs
const starterPrice = STRIPE_CONFIG.plans.starter.priceId;

// Get plan limits
const limit = STRIPE_CONFIG.plans.starter.competitorLimit;

// Generate URLs
const dashboardUrl = getDashboardUrl('/dashboard');
const billingUrl = getBillingUrl();
```

### Email Templates

Email templates receive `dashboardUrl` as a prop (passed from server):

```typescript
// In API route
const emailData = {
  userName: user.name,
  dashboardUrl: getDashboardUrl('/dashboard'),
};
```

### Client-Side Configuration

Only `NEXT_PUBLIC_*` variables are available in client-side code:

```typescript
// Available in browser
const appUrl = process.env.NEXT_PUBLIC_APP_URL;
const stripeKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
```

## Environment-Specific Configuration

### Development
```bash
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXTAUTH_URL=http://localhost:3000
STRIPE_SECRET_KEY=sk_test_...
NODE_ENV=development
```

### Production
```bash
NEXT_PUBLIC_APP_URL=https://your-domain.com
NEXTAUTH_URL=https://your-domain.com
STRIPE_SECRET_KEY=sk_live_...
NODE_ENV=production
```

## Validation

The configuration system validates required variables on startup:

```typescript
import { validateEnv } from '@/lib/config/env';

// Call this in your app initialization
validateEnv();
```

### Error Handling
- **Development**: Logs warning, allows app to continue
- **Production**: Throws error, prevents startup with missing variables

## Configuration Categories

### APP_CONFIG
- Application name, URL, environment

### DATABASE_CONFIG
- PostgreSQL connection string

### AUTH_CONFIG
- NextAuth configuration
- OAuth provider credentials

### STRIPE_CONFIG
- API keys
- Price IDs
- Plan configurations

### EMAIL_CONFIG
- Email provider settings
- From/Reply-To addresses

### TRIAL_CONFIG
- Trial duration
- Grace period length
- Trial competitor limits

### FEATURES
- Feature flags for enabling/disabling features

### CRAWL_CONFIG
- Crawler settings
- Timeouts, concurrency

## Migration from Hardcoded Values

### Before (Hardcoded)
```typescript
const dashboardUrl = 'http://localhost:3000/dashboard';
const priceId = 'price_starter';
const limit = 5;
```

### After (Environment-Based)
```typescript
import { getDashboardUrl, STRIPE_CONFIG } from '@/lib/config/env';

const dashboardUrl = getDashboardUrl('/dashboard');
const priceId = STRIPE_CONFIG.plans.starter.priceId;
const limit = STRIPE_CONFIG.plans.starter.competitorLimit;
```

## Best Practices

### ✅ DO
- Use `/lib/config/env.ts` for all configuration
- Add new environment variables to `.env.example`
- Use helper functions like `getDashboardUrl()`
- Validate required variables on startup
- Use feature flags for optional functionality

### ❌ DON'T
- Hardcode URLs, API keys, or configuration values
- Access `process.env` directly in multiple files
- Commit `.env.local` to version control
- Use production keys in development
- Skip validation in production

## Deployment Checklist

- [ ] Copy `.env.example` to `.env.local`
- [ ] Fill in all required environment variables
- [ ] Update `NEXT_PUBLIC_APP_URL` to your production domain
- [ ] Update `NEXTAUTH_URL` to match your domain
- [ ] Use production Stripe keys (`sk_live_...`, `pk_live_...`)
- [ ] Generate secure `NEXTAUTH_SECRET` (min 32 characters)
- [ ] Set `NODE_ENV=production`
- [ ] Configure Stripe price IDs from your Stripe dashboard
- [ ] Set up cron job secret (`CRON_SECRET`)
- [ ] Configure email provider (Resend API key)
- [ ] Verify all environment variables are set in your hosting platform

## Testing Configuration

Run validation:
```bash
npm run build
# Validates env vars during build
```

Check configuration:
```typescript
import { APP_CONFIG } from '@/lib/config/env';
console.log('App URL:', APP_CONFIG.url);
console.log('Environment:', APP_CONFIG.env);
```

## Support

For configuration issues:
1. Check `.env.example` for required variables
2. Verify variable names match exactly
3. Check the console for validation errors
4. Ensure `NEXT_PUBLIC_*` variables are rebuilt after changes

## Security Notes

- Never commit `.env.local` or `.env.production.local`
- Use different Stripe keys for development and production
- Rotate `NEXTAUTH_SECRET` regularly
- Keep `CRON_SECRET` secure and random
- Use read-only database credentials where possible

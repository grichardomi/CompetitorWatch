/**
 * Centralized environment configuration
 * All environment variables should be accessed through this file
 */

// Validate required environment variables
function getRequiredEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

function getOptionalEnv(key: string, defaultValue: string): string {
  return process.env[key] || defaultValue;
}

// App Configuration
export const APP_CONFIG = {
  name: getOptionalEnv('NEXT_PUBLIC_APP_NAME', 'CompetitorWatch'),
  url: getRequiredEnv('NEXT_PUBLIC_APP_URL'),
  env: getOptionalEnv('NODE_ENV', 'development'),
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
} as const;

// Database Configuration
export const DATABASE_CONFIG = {
  url: getRequiredEnv('DATABASE_URL'),
} as const;

// Authentication Configuration
export const AUTH_CONFIG = {
  secret: getRequiredEnv('NEXTAUTH_SECRET'),
  url: getRequiredEnv('NEXTAUTH_URL'),

  // OAuth Providers
  google: {
    clientId: getOptionalEnv('GOOGLE_CLIENT_ID', ''),
    clientSecret: getOptionalEnv('GOOGLE_CLIENT_SECRET', ''),
  },
  github: {
    clientId: getOptionalEnv('GITHUB_CLIENT_ID', ''),
    clientSecret: getOptionalEnv('GITHUB_CLIENT_SECRET', ''),
  },
} as const;

// Stripe Configuration
export const STRIPE_CONFIG = {
  secretKey: getRequiredEnv('STRIPE_SECRET_KEY'),
  publishableKey: getRequiredEnv('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY'),
  webhookSecret: getRequiredEnv('STRIPE_WEBHOOK_SECRET'),

  // Price IDs
  prices: {
    starter: getOptionalEnv('STRIPE_PRICE_STARTER', 'price_starter'),
    professional: getOptionalEnv('STRIPE_PRICE_PROFESSIONAL', 'price_professional'),
    enterprise: getOptionalEnv('STRIPE_PRICE_ENTERPRISE', 'price_enterprise'),
  },

  // Plan Configurations
  plans: {
    starter: {
      priceId: getOptionalEnv('STRIPE_PRICE_STARTER', 'price_starter'),
      competitorLimit: parseInt(getOptionalEnv('PLAN_STARTER_LIMIT', '5')),
      name: 'Starter',
    },
    professional: {
      priceId: getOptionalEnv('STRIPE_PRICE_PROFESSIONAL', 'price_professional'),
      competitorLimit: parseInt(getOptionalEnv('PLAN_PROFESSIONAL_LIMIT', '20')),
      name: 'Professional',
    },
    enterprise: {
      priceId: getOptionalEnv('STRIPE_PRICE_ENTERPRISE', 'price_enterprise'),
      competitorLimit: parseInt(getOptionalEnv('PLAN_ENTERPRISE_LIMIT', '100')),
      name: 'Enterprise',
    },
  },
} as const;

// Email Configuration
export const EMAIL_CONFIG = {
  from: getOptionalEnv('EMAIL_FROM', 'noreply@competitorwatch.com'),
  replyTo: getOptionalEnv('EMAIL_REPLY_TO', 'support@competitorwatch.com'),

  // Resend API
  resendApiKey: getOptionalEnv('RESEND_API_KEY', ''),
} as const;

// Cron Configuration
export const CRON_CONFIG = {
  secret: getOptionalEnv('CRON_SECRET', ''),
} as const;

// Trial Configuration
export const TRIAL_CONFIG = {
  durationDays: parseInt(getOptionalEnv('TRIAL_DURATION_DAYS', '14')),
  gracePeriodDays: parseInt(getOptionalEnv('TRIAL_GRACE_PERIOD_DAYS', '3')),
  competitorLimit: parseInt(getOptionalEnv('TRIAL_COMPETITOR_LIMIT', '3')),
} as const;

// Feature Flags
export const FEATURES = {
  enableSignup: getOptionalEnv('ENABLE_SIGNUP', 'true') === 'true',
  enableTrials: getOptionalEnv('ENABLE_TRIALS', 'true') === 'true',
  enableAnalytics: getOptionalEnv('ENABLE_ANALYTICS', 'true') === 'true',
} as const;

// Rate Limiting
export const RATE_LIMIT_CONFIG = {
  maxRequests: parseInt(getOptionalEnv('RATE_LIMIT_MAX_REQUESTS', '100')),
  windowMs: parseInt(getOptionalEnv('RATE_LIMIT_WINDOW_MS', '60000')),
} as const;

// Crawl Configuration
export const CRAWL_CONFIG = {
  defaultFrequencyMinutes: parseInt(getOptionalEnv('CRAWL_DEFAULT_FREQUENCY_MINUTES', '60')),
  maxConcurrent: parseInt(getOptionalEnv('CRAWL_MAX_CONCURRENT', '5')),
  timeout: parseInt(getOptionalEnv('CRAWL_TIMEOUT_MS', '30000')),
} as const;

// Helper function to get dashboard URL
export function getDashboardUrl(path: string = ''): string {
  const baseUrl = APP_CONFIG.url.replace(/\/$/, ''); // Remove trailing slash
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${cleanPath}`;
}

// Helper function to get billing URL
export function getBillingUrl(): string {
  return getDashboardUrl('/dashboard/billing');
}

// Helper function to get settings URL
export function getSettingsUrl(): string {
  return getDashboardUrl('/dashboard/settings');
}

// Validate critical environment variables on startup
export function validateEnv(): void {
  try {
    getRequiredEnv('NEXT_PUBLIC_APP_URL');
    getRequiredEnv('DATABASE_URL');
    getRequiredEnv('NEXTAUTH_SECRET');
    getRequiredEnv('NEXTAUTH_URL');
    getRequiredEnv('STRIPE_SECRET_KEY');
    getRequiredEnv('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY');
    getRequiredEnv('STRIPE_WEBHOOK_SECRET');

    console.log('✅ Environment variables validated successfully');
  } catch (error) {
    console.error('❌ Environment validation failed:', error);
    if (process.env.NODE_ENV === 'production') {
      throw error;
    }
  }
}

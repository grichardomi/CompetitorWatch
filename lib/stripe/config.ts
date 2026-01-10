import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
});

export const PRICING_PLANS = {
  starter: {
    name: 'Starter',
    monthlyPrice: 4900, // $49/month
    competitorLimit: 5,
    features: ['5 competitors', 'Daily tracking', 'Email alerts', '30-day history'],
    monthlyPriceId: process.env.STRIPE_STARTER_PRICE_ID || '',
  },
  professional: {
    name: 'Professional',
    monthlyPrice: 9900, // $99/month
    annualPrice: 94800, // $948/year ($79/month equivalent)
    competitorLimit: 20,
    features: ['20 competitors', 'Twice-daily tracking', 'Email + SMS alerts', '90-day history', 'Webhooks (5)'],
    monthlyPriceId: process.env.STRIPE_PRO_MONTHLY_PRICE_ID || '',
    annualPriceId: process.env.STRIPE_PRO_ANNUAL_PRICE_ID || '',
  },
  enterprise: {
    name: 'Enterprise',
    monthlyPrice: 29900, // $299/month
    annualPrice: 298800, // $2,988/year ($249/month equivalent)
    competitorLimit: -1, // Unlimited
    features: ['Unlimited competitors', 'Hourly tracking', 'Unlimited SMS', 'API access', 'Dedicated support'],
    monthlyPriceId: process.env.STRIPE_ENTERPRISE_MONTHLY_PRICE_ID || '',
    annualPriceId: process.env.STRIPE_ENTERPRISE_ANNUAL_PRICE_ID || '',
  },
} as const;

// Helper to get price ID based on plan and billing cycle
export function getPriceId(plan: keyof typeof PRICING_PLANS, billingCycle: 'monthly' | 'annual' = 'monthly'): string {
  const planConfig = PRICING_PLANS[plan];

  if (billingCycle === 'annual' && 'annualPriceId' in planConfig) {
    return planConfig.annualPriceId;
  }

  return 'monthlyPriceId' in planConfig ? planConfig.monthlyPriceId : '';
}

// Helper to get competitor limit from price ID
export function getCompetitorLimitFromPriceId(priceId: string): number {
  for (const plan of Object.values(PRICING_PLANS)) {
    const monthlyMatch = 'monthlyPriceId' in plan && plan.monthlyPriceId === priceId;
    const annualMatch = 'annualPriceId' in plan && plan.annualPriceId === priceId;

    if (monthlyMatch || annualMatch) {
      return plan.competitorLimit;
    }
  }

  return 5; // Default to starter limit
}

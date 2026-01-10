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
    price: 4900, // in cents
    competitorLimit: 5,
    features: ['5 competitors', 'Email alerts', 'Basic reporting'],
    stripePriceId: process.env.STRIPE_STARTER_PRICE_ID || '',
  },
  pro: {
    name: 'Pro',
    price: 9900,
    competitorLimit: 20,
    features: ['20 competitors', 'Email + SMS alerts', 'Advanced reporting', 'Webhooks'],
    stripePriceId: process.env.STRIPE_PRO_PRICE_ID || '',
  },
  enterprise: {
    name: 'Enterprise',
    price: 29900,
    competitorLimit: 100,
    features: ['100 competitors', 'All features', 'Priority support', 'Custom integration'],
    stripePriceId: process.env.STRIPE_ENTERPRISE_PRICE_ID || '',
  },
};

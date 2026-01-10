'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Pricing() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState('');

  const plans = [
    {
      id: 'starter',
      name: 'Starter',
      price: 49,
      competitors: 5,
      features: ['5 competitors', 'Email alerts', 'Basic analytics', 'Mobile app access'],
      highlighted: false,
    },
    {
      id: 'professional',
      name: 'Professional',
      price: 99,
      competitors: 20,
      features: [
        '20 competitors',
        'Email + SMS alerts',
        'Advanced analytics',
        'Webhook integrations',
        'Priority support',
      ],
      highlighted: true,
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: 299,
      competitors: 100,
      features: [
        '100 competitors',
        'All Pro features',
        'Custom integrations',
        'Dedicated support',
        'SLA guarantee',
      ],
      highlighted: false,
    },
  ];

  const handleGetStarted = async (planId: string) => {
    // If not authenticated, redirect to signin
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
      return;
    }

    // If loading, wait
    if (status === 'loading') {
      return;
    }

    try {
      setLoading(planId);
      setError('');

      const res = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: planId, billingCycle: 'monthly' }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create checkout session');
      }

      // Redirect to Stripe checkout
      window.location.href = data.checkoutUrl;
    } catch (err: any) {
      console.error('Checkout error:', err);
      setError(err.message || 'Failed to start checkout');
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4">
        <div className="container mx-auto flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-blue-600">
            CompetitorWatch
          </Link>
          <Link
            href="/auth/signin"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Sign In
          </Link>
        </div>
      </header>

      {/* Pricing Section */}
      <main className="container mx-auto px-4 sm:px-6 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl sm:text-5xl font-bold mb-4">Simple, Transparent Pricing</h1>
          <p className="text-lg text-gray-600">
            Choose the plan that fits your business needs
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map(plan => (
            <div
              key={plan.name}
              className={`rounded-lg border p-8 transition-all ${
                plan.highlighted
                  ? 'bg-blue-50 border-blue-300 shadow-lg scale-105'
                  : 'bg-white border-gray-200'
              }`}
            >
              {/* Badge */}
              {plan.highlighted && (
                <div className="inline-block px-3 py-1 bg-blue-600 text-white text-sm font-semibold rounded-full mb-4">
                  Most Popular
                </div>
              )}

              {/* Plan Name */}
              <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
              <p className="text-gray-600 mb-6">Up to {plan.competitors} competitors</p>

              {/* Price */}
              <div className="mb-6">
                <span className="text-5xl font-bold">${plan.price}</span>
                <span className="text-gray-600">/month</span>
              </div>

              {/* CTA Button */}
              <button
                className={`w-full px-4 py-2 rounded-lg font-semibold transition-colors mb-8 ${
                  plan.highlighted
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                }`}
              >
                Get Started
              </button>

              {/* Features List */}
              <ul className="space-y-4">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <span className="text-green-600 font-bold mt-1">✓</span>
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Trial Info */}
        <div className="mt-16 text-center">
          <p className="text-lg text-gray-600">
            All plans include a <span className="font-semibold">14-day free trial</span> with full
            features
          </p>
        </div>
      </main>
    </div>
  );
}

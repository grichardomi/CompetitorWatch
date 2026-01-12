'use client';

/**
 * HONEST PRICING PAGE
 *
 * This version only lists features that are actually implemented and working.
 * Replace /app/pricing/page.tsx with this content when ready to be honest with customers.
 */

import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function HonestPricing() {
  const { status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState('');

  const plans = [
    {
      id: 'starter',
      name: 'Starter',
      price: 49,
      description: 'Perfect for small businesses monitoring key competitors',
      competitors: 5,
      features: [
        '✅ Monitor up to 5 competitors',
        '✅ Daily automated price tracking',
        '✅ Instant email alerts',
        '✅ Price change notifications',
        '✅ Promotion monitoring',
        '✅ 30-day price history',
        '✅ Mobile-optimized web interface',
        '✅ Email support',
      ],
      highlighted: false,
      comingSoon: [],
    },
    {
      id: 'professional',
      name: 'Professional',
      price: 99,
      description: 'Advanced monitoring for growing businesses',
      competitors: 20,
      features: [
        '✅ Monitor up to 20 competitors',
        '✅ Automated price tracking',
        '✅ Email alerts with filtering',
        '✅ 90-day price history',
        '✅ Promotion tracking',
        '✅ Menu/service change detection',
        '✅ Mobile-optimized interface',
        '✅ Priority email support',
      ],
      highlighted: true,
      comingSoon: [
        '🚧 SMS alerts (coming soon)',
        '🚧 Webhook integrations (coming soon)',
        '🚧 Advanced analytics (coming soon)',
        '🚧 CSV export (coming soon)',
        '🚧 Weekly reports (coming soon)',
      ],
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: 299,
      description: 'Complete solution for serious competitors',
      competitors: 'Unlimited',
      features: [
        '✅ Monitor unlimited competitors',
        '✅ Automated tracking',
        '✅ Unlimited price history',
        '✅ All Starter & Pro features',
        '✅ Priority support',
      ],
      highlighted: false,
      comingSoon: [
        '🚧 Hourly tracking (coming soon)',
        '🚧 Multi-location support (coming soon)',
        '🚧 REST API access (coming soon)',
        '🚧 Custom alert rules (coming soon)',
        '🚧 Advanced analytics (coming soon)',
        '🚧 Dedicated account manager (coming soon)',
        '🚧 SMS alerts (coming soon)',
        '🚧 Webhook integrations (coming soon)',
      ],
    },
  ];

  const handleGetStarted = async (planId: string) => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
      return;
    }

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
            MarketPulse
          </Link>
          <div className="flex items-center gap-4">
            {status === 'authenticated' ? (
              <>
                <Link href="/dashboard" className="px-4 py-2 text-gray-600 hover:text-gray-900">
                  Dashboard
                </Link>
                <Link
                  href="/dashboard/billing"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  My Account
                </Link>
              </>
            ) : (
              <Link
                href="/auth/signin"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Pricing Section */}
      <main className="container mx-auto px-4 sm:px-6 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold mb-4">Simple, Transparent Pricing</h1>
          <p className="text-lg text-gray-600 mb-2">
            Choose the plan that fits your business needs
          </p>
          <p className="text-sm text-gray-500">
            All plans include a 14-day free trial • Cancel anytime
          </p>
        </div>

        {/* Roadmap Notice */}
        <div className="max-w-3xl mx-auto mb-12 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-900">
            <strong>🚀 We're building in public!</strong> Features marked with 🚧 are in development.
            Check our <Link href="/roadmap" className="underline">public roadmap</Link> for ETAs.
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="max-w-2xl mx-auto mb-8 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`rounded-lg border p-8 transition-all ${
                plan.highlighted
                  ? 'bg-blue-50 border-blue-300 shadow-lg scale-105 relative'
                  : 'bg-white border-gray-200'
              }`}
            >
              {/* Badge */}
              {plan.highlighted && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <div className="px-4 py-1 bg-blue-600 text-white text-sm font-semibold rounded-full">
                    Most Popular
                  </div>
                </div>
              )}

              {/* Plan Name */}
              <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
              <p className="text-gray-600 text-sm mb-6">{plan.description}</p>

              {/* Price */}
              <div className="mb-6">
                <span className="text-5xl font-bold">${plan.price}</span>
                <span className="text-gray-600">/month</span>
              </div>

              {/* Competitor Limit */}
              <div className="mb-6 pb-6 border-b border-gray-200">
                <p className="text-sm text-gray-600">Monitor up to</p>
                <p className="text-xl font-bold text-gray-900">{plan.competitors} competitors</p>
              </div>

              {/* CTA Button */}
              <button
                onClick={() => handleGetStarted(plan.id)}
                disabled={loading !== null}
                className={`w-full px-4 py-3 rounded-lg font-semibold transition-colors mb-6 disabled:opacity-50 disabled:cursor-not-allowed ${
                  plan.highlighted
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                }`}
              >
                {loading === plan.id ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    Loading...
                  </span>
                ) : (
                  'Start Free Trial'
                )}
              </button>

              {/* Working Features */}
              <div className="mb-4">
                <p className="text-xs font-semibold text-gray-700 uppercase mb-3">Included Features</p>
                <ul className="space-y-3">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      <span className="text-green-600 mt-0.5">✓</span>
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Coming Soon Features */}
              {plan.comingSoon.length > 0 && (
                <div className="pt-4 border-t border-gray-200">
                  <p className="text-xs font-semibold text-gray-700 uppercase mb-3">Coming Soon</p>
                  <ul className="space-y-2">
                    {plan.comingSoon.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm">
                        <span className="text-gray-400">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Trust Section */}
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl font-bold mb-4">Why Choose MarketPulse?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="p-4">
              <div className="text-3xl mb-2">🤖</div>
              <h3 className="font-semibold mb-1">AI-Powered</h3>
              <p className="text-sm text-gray-600">Claude AI extracts pricing data automatically</p>
            </div>
            <div className="p-4">
              <div className="text-3xl mb-2">⚡</div>
              <h3 className="font-semibold mb-1">Real-Time Alerts</h3>
              <p className="text-sm text-gray-600">Get notified instantly when prices change</p>
            </div>
            <div className="p-4">
              <div className="text-3xl mb-2">📊</div>
              <h3 className="font-semibold mb-1">Historical Data</h3>
              <p className="text-sm text-gray-600">Track pricing trends over time</p>
            </div>
          </div>

          <p className="text-sm text-gray-500">
            All plans include a 14-day free trial with full features. No credit card required for trial.
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-8 px-4 bg-white">
        <div className="container mx-auto text-center text-gray-600 text-sm">
          <p className="mb-2">&copy; 2024 MarketPulse. All rights reserved.</p>
          <div className="flex justify-center gap-4">
            <Link href="/roadmap" className="hover:text-gray-900">Product Roadmap</Link>
            <Link href="/terms" className="hover:text-gray-900">Terms</Link>
            <Link href="/privacy" className="hover:text-gray-900">Privacy</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

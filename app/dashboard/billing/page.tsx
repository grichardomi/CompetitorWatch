'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Subscription {
  status: string;
  stripePriceId: string;
  competitorLimit: number;
  competitorsUsed: number;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  daysRemaining: number | null;
}

interface Payment {
  id: number;
  amount: number;
  amountFormatted: string;
  currency: string;
  status: string;
  createdAt: string;
}

export default function BillingPage() {
  const { status } = useSession();
  const router = useRouter();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [upgrading, setUpgrading] = useState(false);
  const [managingBilling, setManagingBilling] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    } else if (status === 'authenticated') {
      loadBillingData();
    }
  }, [status, router]);

  const loadBillingData = async () => {
    try {
      setLoading(true);

      // Fetch subscription
      const subRes = await fetch('/api/billing/subscription');
      const subData = await subRes.json();

      if (subData.hasSubscription) {
        setSubscription(subData.subscription);
      }

      // Fetch payment history
      const payRes = await fetch('/api/billing/payments');
      const payData = await payRes.json();
      setPayments(payData.payments || []);

      setError('');
    } catch (err) {
      console.error('Failed to load billing data:', err);
      setError('Failed to load billing information');
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async (plan: string, billingCycle: string = 'monthly') => {
    try {
      setUpgrading(true);
      const res = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan, billingCycle }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create checkout session');
      }

      // Redirect to Stripe checkout
      window.location.href = data.checkoutUrl;
    } catch (err: any) {
      setError(err.message || 'Failed to upgrade');
      setUpgrading(false);
    }
  };

  const handleManageBilling = async () => {
    try {
      setManagingBilling(true);
      const res = await fetch('/api/billing/portal', {
        method: 'POST',
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to open billing portal');
      }

      // Redirect to Stripe customer portal
      window.location.href = data.portalUrl;
    } catch (err: any) {
      setError(err.message || 'Failed to open billing portal');
      setManagingBilling(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading billing information...</p>
        </div>
      </div>
    );
  }

  const isTrialing = subscription?.status === 'trialing';
  const isPaid = subscription?.status === 'active';
  const isPastDue = subscription?.status === 'past_due';

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-0">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="container mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-2xl font-bold text-blue-600">
              CompetitorWatch
            </Link>

            {/* Desktop Menu */}
            <nav className="hidden md:flex items-center gap-8 flex-1 mx-8">
              <Link href="/dashboard" className="text-gray-600 hover:text-gray-900 font-medium">
                Dashboard
              </Link>
              <Link href="/dashboard/competitors" className="text-gray-600 hover:text-gray-900 font-medium">
                Competitors
              </Link>
              <Link href="/dashboard/alerts" className="text-gray-600 hover:text-gray-900 font-medium">
                Alerts
              </Link>
              <Link
                href="/dashboard/billing"
                className="text-blue-600 font-medium border-b-2 border-blue-600"
              >
                Billing
              </Link>
              <Link href="/dashboard/settings" className="text-gray-600 hover:text-gray-900 font-medium">
                Settings
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 sm:px-6 py-8">
        <h1 className="text-3xl font-bold mb-6">Billing & Subscription</h1>

        {/* Error message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {/* Trial Warning */}
        {isTrialing && subscription?.daysRemaining !== null && subscription.daysRemaining <= 7 && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-yellow-900 font-medium">
              ⏰ Your trial ends in {subscription.daysRemaining} {subscription.daysRemaining === 1 ? 'day' : 'days'}.
              Upgrade now to continue monitoring your competitors.
            </p>
          </div>
        )}

        {/* Past Due Warning */}
        {isPastDue && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-900 font-medium">
              ⚠️ Your payment failed. Please update your payment method to continue service.
            </p>
            <button
              onClick={handleManageBilling}
              disabled={managingBilling}
              className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
            >
              {managingBilling ? 'Opening...' : 'Update Payment Method'}
            </button>
          </div>
        )}

        {/* Current Plan Card */}
        {subscription && (
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Current Plan</h2>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                isTrialing ? 'bg-blue-100 text-blue-700' :
                isPaid ? 'bg-green-100 text-green-700' :
                'bg-gray-100 text-gray-700'
              }`}>
                {subscription.status === 'trialing' ? 'Trial' : subscription.status}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div>
                <p className="text-sm text-gray-600">Competitor Limit</p>
                <p className="text-2xl font-bold">
                  {subscription.competitorLimit === -1 ? 'Unlimited' : subscription.competitorLimit}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  {subscription.competitorsUsed} used
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Current Period</p>
                <p className="text-lg font-semibold">
                  {new Date(subscription.currentPeriodStart).toLocaleDateString()} -
                  {' '}{new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Next Billing Date</p>
                <p className="text-lg font-semibold">
                  {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                </p>
              </div>
            </div>

            {isTrialing && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <button
                  onClick={() => handleUpgrade('starter')}
                  disabled={upgrading}
                  className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
                >
                  Upgrade to Starter ($49/mo)
                </button>
                <button
                  onClick={() => handleUpgrade('professional')}
                  disabled={upgrading}
                  className="px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 font-medium"
                >
                  Upgrade to Pro ($99/mo)
                </button>
                <button
                  onClick={() => handleUpgrade('enterprise')}
                  disabled={upgrading}
                  className="px-4 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-900 disabled:opacity-50 font-medium"
                >
                  Upgrade to Enterprise ($299/mo)
                </button>
              </div>
            )}

            {isPaid && (
              <button
                onClick={handleManageBilling}
                disabled={managingBilling}
                className="px-4 py-2 bg-gray-100 text-gray-900 rounded-lg hover:bg-gray-200 disabled:opacity-50 font-medium"
              >
                {managingBilling ? 'Opening...' : 'Manage Subscription'}
              </button>
            )}
          </div>
        )}

        {/* Payment History */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-xl font-semibold mb-4">Payment History</h2>

          {payments.length === 0 ? (
            <p className="text-gray-600 text-center py-8">No payment history yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Date</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Amount</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((payment) => (
                    <tr key={payment.id} className="border-b border-gray-100">
                      <td className="py-3 px-4">
                        {new Date(payment.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4">{payment.amountFormatted}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          payment.status === 'succeeded' ? 'bg-green-100 text-green-700' :
                          payment.status === 'failed' ? 'bg-red-100 text-red-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {payment.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 md:hidden safe-bottom z-40">
        <div className="flex justify-around">
          {[
            { label: 'Dashboard', href: '/dashboard', icon: '📊' },
            { label: 'Competitors', href: '/dashboard/competitors', icon: '👥' },
            { label: 'Alerts', href: '/dashboard/alerts', icon: '🔔' },
            { label: 'Billing', href: '/dashboard/billing', icon: '💳' },
            { label: 'Settings', href: '/dashboard/settings', icon: '⚙️' },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center py-3 px-4 text-xs font-medium ${
                item.href === '/dashboard/billing'
                  ? 'text-blue-600'
                  : 'text-gray-600 hover:text-blue-600'
              }`}
            >
              <span className="text-lg mb-1">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}

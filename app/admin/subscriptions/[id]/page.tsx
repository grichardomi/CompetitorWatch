'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

interface User {
  id: string;
  email: string;
  name: string | null;
  stripeCustomerId: string | null;
  createdAt: Date;
}

interface Subscription {
  id: string;
  userId: string;
  user: User;
  stripeSubscriptionId: string | null;
  stripePriceId: string;
  planName: string;
  status: string;
  competitorLimit: number;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface Payment {
  id: string;
  userId: string;
  stripePaymentId: string; // Maps to stripePaymentIntentId from API
  amount: number;
  currency: string;
  status: string;
  createdAt: Date;
}

export default function SubscriptionDetailsPage() {
  const params = useParams();
  const subscriptionId = params.id as string;

  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch subscription details
        const subRes = await fetch(`/api/admin/subscriptions?search=${subscriptionId}`);
        const subData = await subRes.json();

        if (!subData.subscriptions || subData.subscriptions.length === 0) {
          setError('Subscription not found');
          setLoading(false);
          return;
        }

        const sub = subData.subscriptions.find((s: Subscription) => s.id === subscriptionId);
        if (!sub) {
          setError('Subscription not found');
          setLoading(false);
          return;
        }

        setSubscription(sub);

        // Fetch payment history for this user
        const payRes = await fetch(`/api/billing/payments?userId=${sub.userId}`);
        if (payRes.ok) {
          const payData = await payRes.json();
          setPayments(payData.payments || []);
        }

        setLoading(false);
      } catch (err) {
        console.error('Failed to fetch subscription details:', err);
        setError('Failed to load subscription details');
        setLoading(false);
      }
    };

    fetchData();
  }, [subscriptionId]);

  const handlePause = async () => {
    if (!subscription || !confirm('Are you sure you want to pause this subscription?')) return;

    setActionLoading(true);
    try {
      const res = await fetch('/api/admin/subscriptions/pause', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscriptionId: subscription.id }),
      });

      if (!res.ok) throw new Error('Failed to pause');

      setMessage({ type: 'success', text: 'Subscription paused successfully' });
      window.location.reload();
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to pause subscription' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleResume = async () => {
    if (!subscription || !confirm('Are you sure you want to resume this subscription?')) return;

    setActionLoading(true);
    try {
      const res = await fetch('/api/admin/subscriptions/resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscriptionId: subscription.id }),
      });

      if (!res.ok) throw new Error('Failed to resume');

      setMessage({ type: 'success', text: 'Subscription resumed successfully' });
      window.location.reload();
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to resume subscription' });
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      active: 'bg-green-100 text-green-800',
      trialing: 'bg-blue-100 text-blue-800',
      paused: 'bg-purple-100 text-purple-800',
      past_due: 'bg-yellow-100 text-yellow-800',
      canceled: 'bg-red-100 text-red-800',
      succeeded: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
      pending: 'bg-yellow-100 text-yellow-800',
    };

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[status] || 'bg-gray-100 text-gray-800'}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center text-gray-600">Loading subscription details...</div>
      </div>
    );
  }

  if (error || !subscription) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-800">{error || 'Subscription not found'}</p>
        </div>
        <Link href="/admin/subscriptions" className="text-blue-600 hover:text-blue-800">
          ← Back to Subscriptions
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <Link href="/admin/subscriptions" className="text-blue-600 hover:text-blue-800 text-sm mb-2 inline-block">
          ← Back to Subscriptions
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Subscription Details</h1>
        <p className="text-gray-600 mt-1">{subscription.planName} - {subscription.user.email}</p>
      </div>

      {/* Message */}
      {message && (
        <div className={`mb-6 p-4 rounded-lg ${message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
          {message.text}
          <button onClick={() => setMessage(null)} className="ml-4 underline">Dismiss</button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Subscription Info */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Subscription Information</h2>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-600">Plan</p>
              <p className="text-sm font-medium text-gray-900">{subscription.planName}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Status</p>
              <div className="mt-1">{getStatusBadge(subscription.status)}</div>
            </div>
            <div>
              <p className="text-sm text-gray-600">Competitor Limit</p>
              <p className="text-sm font-medium text-gray-900">{subscription.competitorLimit} competitors</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Current Period</p>
              <p className="text-sm font-medium text-gray-900">
                {new Date(subscription.currentPeriodStart).toLocaleDateString()} - {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
              </p>
            </div>
            {subscription.cancelAtPeriodEnd && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-sm text-yellow-900 font-medium">
                  This subscription will cancel at the end of the current period
                </p>
              </div>
            )}
            <div>
              <p className="text-sm text-gray-600">Stripe Subscription ID</p>
              <p className="text-sm font-mono text-gray-900">{subscription.stripeSubscriptionId || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Created</p>
              <p className="text-sm text-gray-900">
                {new Date(subscription.createdAt).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="flex flex-wrap gap-3">
              {subscription.status === 'active' && subscription.stripePriceId !== 'trial' && (
                <button
                  onClick={handlePause}
                  disabled={actionLoading}
                  className="px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 disabled:opacity-50"
                >
                  {actionLoading ? 'Pausing...' : 'Pause Subscription'}
                </button>
              )}
              {subscription.status === 'paused' && (
                <button
                  onClick={handleResume}
                  disabled={actionLoading}
                  className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {actionLoading ? 'Resuming...' : 'Resume Subscription'}
                </button>
              )}
              {subscription.stripeSubscriptionId && subscription.stripeSubscriptionId !== `trial_${subscription.userId}` && (
                <a
                  href={`https://dashboard.stripe.com/subscriptions/${subscription.stripeSubscriptionId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
                >
                  View in Stripe Dashboard
                </a>
              )}
            </div>
          </div>
        </div>

        {/* User Info */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">User Information</h2>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-600">Name</p>
              <p className="text-sm font-medium text-gray-900">{subscription.user.name || 'No name set'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Email</p>
              <p className="text-sm font-medium text-gray-900">{subscription.user.email}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">User ID</p>
              <p className="text-sm font-mono text-gray-900">{subscription.user.id}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Stripe Customer ID</p>
              <p className="text-sm font-mono text-gray-900">{subscription.user.stripeCustomerId || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Account Created</p>
              <p className="text-sm text-gray-900">
                {new Date(subscription.user.createdAt).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </p>
            </div>
          </div>

          {/* User Actions */}
          {subscription.user.stripeCustomerId && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <a
                href={`https://dashboard.stripe.com/customers/${subscription.user.stripeCustomerId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block px-4 py-2 bg-gray-600 text-white text-sm font-medium rounded-lg hover:bg-gray-700"
              >
                View Customer in Stripe
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Payment History */}
      <div className="mt-6 bg-white rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Payment History</h2>
        </div>
        {payments.length === 0 ? (
          <div className="p-6 text-center text-gray-600">No payments recorded</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Description</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Stripe ID</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {payments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {new Date(payment.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      ${(payment.amount / 100).toFixed(2)} {payment.currency.toUpperCase()}
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(payment.status)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {payment.amount ? `$${(payment.amount / 100).toFixed(2)}` : 'N/A'}
                    </td>
                    <td className="px-6 py-4">
                      <a
                        href={`https://dashboard.stripe.com/payments/${payment.stripePaymentId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:text-blue-800 font-mono"
                      >
                        {payment.stripePaymentId}
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

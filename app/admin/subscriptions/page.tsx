'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Subscription {
  id: string;
  userId: string;
  user: {
    id: string;
    email: string;
    name: string | null;
    stripeCustomerId: string | null;
  };
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

export default function AdminSubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [plan, setPlan] = useState('all');
  const [status, setStatus] = useState('all');
  const [search, setSearch] = useState('');

  const fetchSubscriptions = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (plan !== 'all') params.append('plan', plan);
    if (status !== 'all') params.append('status', status);
    if (search) params.append('search', search);

    const res = await fetch(`/api/admin/subscriptions?${params}`);
    const data = await res.json();

    if (data.subscriptions) {
      setSubscriptions(data.subscriptions);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchSubscriptions();
  }, [plan, status, search]);

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      active: 'bg-green-100 text-green-800',
      trialing: 'bg-blue-100 text-blue-800',
      paused: 'bg-purple-100 text-purple-800',
      grace_period: 'bg-orange-100 text-orange-800',
      past_due: 'bg-yellow-100 text-yellow-800',
      canceled: 'bg-red-100 text-red-800',
      expired: 'bg-red-100 text-red-800',
    };

    const label = status === 'grace_period' ? 'Grace Period' : status.charAt(0).toUpperCase() + status.slice(1);

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[status] || 'bg-gray-100 text-gray-800'}`}>
        {label}
      </span>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Subscriptions</h1>
        <p className="text-gray-600 mt-1">Manage and view all user subscriptions</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Plan Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Plan</label>
            <select
              value={plan}
              onChange={(e) => setPlan(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Plans</option>
              <option value="trial">Trial</option>
              <option value="starter">Starter</option>
              <option value="professional">Professional</option>
              <option value="enterprise">Enterprise</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="trialing">Trialing</option>
              <option value="past_due">Past Due</option>
              <option value="canceled">Canceled</option>
            </select>
          </div>

          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <input
              type="text"
              placeholder="Email or name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Subscriptions Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-600">Loading subscriptions...</div>
        ) : subscriptions.length === 0 ? (
          <div className="p-8 text-center text-gray-600">No subscriptions found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">User</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Plan</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Limit</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Period End</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {subscriptions.map((sub) => (
                  <tr key={sub.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium text-gray-900">{sub.user.name || 'No name'}</div>
                      <div className="text-xs text-gray-600">{sub.user.email}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-gray-900">{sub.planName}</div>
                      {sub.cancelAtPeriodEnd && (
                        <div className="text-xs text-red-600">Cancels at period end</div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {getStatusBadge(sub.status)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {sub.competitorLimit} competitors
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {new Date(sub.currentPeriodEnd).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/subscriptions/${sub.id}`}
                        className="text-sm text-blue-600 hover:text-blue-800"
                      >
                        View Details
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Summary Footer */}
        {!loading && subscriptions.length > 0 && (
          <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              Showing {subscriptions.length} subscription{subscriptions.length !== 1 ? 's' : ''}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

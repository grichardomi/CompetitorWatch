'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface AdminStats {
  totalUsers: number;
  activeSubscriptions: number;
  totalRevenue: number;
  recentSignups: Array<{
    id: number;
    email: string;
    name: string | null;
    createdAt: string;
  }>;
}

interface Metrics {
  mrr: number;
  totalRevenue: number;
  recentRevenue: number;
  subscriptionCounts: {
    active: number;
    trialing: number;
    pastDue: number;
    canceled: number;
  };
  conversionRate: number;
  churnRate: number;
  revenueByPlan: {
    starter: number;
    professional: number;
    enterprise: number;
  };
}

export default function AdminPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadStats();
    loadMetrics();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/stats');

      if (!res.ok) {
        throw new Error('Failed to load stats');
      }

      const data = await res.json();
      setStats(data);
      setError('');
    } catch (err) {
      console.error('Failed to load stats:', err);
      setError('Failed to load admin stats');
    } finally {
      setLoading(false);
    }
  };

  const loadMetrics = async () => {
    try {
      const res = await fetch('/api/admin/metrics');

      if (!res.ok) {
        throw new Error('Failed to load metrics');
      }

      const data = await res.json();
      setMetrics(data);
    } catch (err) {
      console.error('Failed to load metrics:', err);
    }
  };

  if (loading) {
    return (
      <main className="container mx-auto px-4 sm:px-6 py-8">
        <div className="text-center py-12">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading stats...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="container mx-auto px-4 sm:px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
        <p className="text-gray-600">Platform overview and key metrics</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {stats && (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium">Total Users</p>
                  <p className="text-4xl font-bold mt-2">{stats.totalUsers}</p>
                </div>
                <span className="text-4xl">👥</span>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium">Active Subscriptions</p>
                  <p className="text-4xl font-bold mt-2 text-green-600">{stats.activeSubscriptions}</p>
                </div>
                <span className="text-4xl">💳</span>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium">Total Revenue</p>
                  <p className="text-4xl font-bold mt-2 text-purple-600">
                    ${(stats.totalRevenue / 100).toFixed(0)}
                  </p>
                </div>
                <span className="text-4xl">💰</span>
              </div>
            </div>
          </div>

          {/* Revenue Metrics */}
          {metrics && (
            <>
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Revenue Metrics</h2>
                <p className="text-sm text-gray-600 mt-1">Monthly recurring revenue and growth indicators</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg border border-green-200 p-6">
                  <p className="text-sm text-green-700 font-medium">MRR</p>
                  <p className="text-3xl font-bold mt-2 text-green-900">
                    ${metrics.mrr.toLocaleString()}
                  </p>
                  <p className="text-xs text-green-600 mt-1">Monthly Recurring Revenue</p>
                </div>

                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200 p-6">
                  <p className="text-sm text-blue-700 font-medium">Conversion Rate</p>
                  <p className="text-3xl font-bold mt-2 text-blue-900">
                    {metrics.conversionRate.toFixed(1)}%
                  </p>
                  <p className="text-xs text-blue-600 mt-1">Trial to paid conversion</p>
                </div>

                <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg border border-yellow-200 p-6">
                  <p className="text-sm text-yellow-700 font-medium">Churn Rate</p>
                  <p className="text-3xl font-bold mt-2 text-yellow-900">
                    {metrics.churnRate}%
                  </p>
                  <p className="text-xs text-yellow-600 mt-1">Last 30 days</p>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg border border-purple-200 p-6">
                  <p className="text-sm text-purple-700 font-medium">Recent Revenue</p>
                  <p className="text-3xl font-bold mt-2 text-purple-900">
                    ${metrics.recentRevenue.toLocaleString()}
                  </p>
                  <p className="text-xs text-purple-600 mt-1">Last 30 days</p>
                </div>
              </div>

              {/* Revenue by Plan */}
              <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue by Plan</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600 font-medium">Starter</p>
                    <p className="text-2xl font-bold mt-1 text-gray-900">
                      ${metrics.revenueByPlan.starter.toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600 font-medium">Professional</p>
                    <p className="text-2xl font-bold mt-1 text-gray-900">
                      ${metrics.revenueByPlan.professional.toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600 font-medium">Enterprise</p>
                    <p className="text-2xl font-bold mt-1 text-gray-900">
                      ${metrics.revenueByPlan.enterprise.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Subscription Status Breakdown */}
              <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Subscription Status</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-green-600">{metrics.subscriptionCounts.active}</p>
                    <p className="text-sm text-gray-600 mt-1">Active</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-blue-600">{metrics.subscriptionCounts.trialing}</p>
                    <p className="text-sm text-gray-600 mt-1">Trialing</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-yellow-600">{metrics.subscriptionCounts.pastDue}</p>
                    <p className="text-sm text-gray-600 mt-1">Past Due</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-red-600">{metrics.subscriptionCounts.canceled}</p>
                    <p className="text-sm text-gray-600 mt-1">Canceled</p>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Recent Signups */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Recent Signups</h2>
              <Link
                href="/admin/users"
                className="text-sm text-blue-600 hover:underline font-medium"
              >
                View all users →
              </Link>
            </div>

            {stats.recentSignups.length === 0 ? (
              <p className="text-center py-8 text-gray-600">No recent signups</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Email</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Name</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Joined</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.recentSignups.map((user) => (
                      <tr key={user.id} className="border-b border-gray-100">
                        <td className="py-3 px-4 text-sm">{user.email}</td>
                        <td className="py-3 px-4 text-sm">{user.name || '-'}</td>
                        <td className="py-3 px-4 text-sm text-gray-600">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Quick Links */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
            <Link href="/admin/users">
              <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <span className="text-2xl">👥</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Manage Users</h3>
                    <p className="text-sm text-gray-600">View and manage user accounts</p>
                  </div>
                </div>
              </div>
            </Link>

            <Link href="/admin/subscriptions">
              <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <span className="text-2xl">💳</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Subscriptions</h3>
                    <p className="text-sm text-gray-600">View and manage subscriptions</p>
                  </div>
                </div>
              </div>
            </Link>

            <Link href="/admin/system">
              <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <span className="text-2xl">⚙️</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">System Health</h3>
                    <p className="text-sm text-gray-600">Monitor queues and errors</p>
                  </div>
                </div>
              </div>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-6">
            <Link href="/admin/trials">
              <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <span className="text-2xl">🎯</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Trial Management</h3>
                    <p className="text-sm text-gray-600">Manage and convert trials</p>
                  </div>
                </div>
              </div>
            </Link>

            <Link href="/admin/analytics">
              <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                    <span className="text-2xl">📊</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Analytics</h3>
                    <p className="text-sm text-gray-600">Trial conversion metrics</p>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        </>
      )}
    </main>
  );
}

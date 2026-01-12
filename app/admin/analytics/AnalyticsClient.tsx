'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface ConversionAnalytics {
  period: string;
  overview: {
    totalTrials: number;
    convertedTrials: number;
    conversionRate: number;
    avgDaysToConvert: number;
    trialsExpiringSoon: number;
  };
  statusBreakdown: {
    trialing: number;
    grace_period: number;
    expired: number;
    converted: number;
  };
  conversions: Array<{
    userId: number;
    userEmail: string;
    trialStart: string;
    convertedAt: string;
    daysToConvert: number;
    plan: string;
  }>;
  recentConversions: number;
}

export default function AnalyticsClient() {
  const [analytics, setAnalytics] = useState<ConversionAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);

  useEffect(() => {
    loadAnalytics();
  }, [days]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/analytics/trial-conversion?days=${days}`);
      if (!res.ok) throw new Error('Failed to load analytics');

      const data = await res.json();
      setAnalytics(data);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center text-gray-600">Failed to load analytics</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Trial Conversion Analytics</h1>
        <p className="text-gray-600 mt-1">Track trial signups, conversions, and user behavior</p>
      </div>

      {/* Time Range Selector */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-gray-700">Time Period:</label>
          <div className="flex gap-2">
            <button
              onClick={() => setDays(7)}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${days === 7 ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              Last 7 days
            </button>
            <button
              onClick={() => setDays(30)}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${days === 30 ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              Last 30 days
            </button>
            <button
              onClick={() => setDays(90)}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${days === 90 ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              Last 90 days
            </button>
          </div>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-600 font-medium">Total Trials</p>
          <p className="text-3xl font-bold mt-2 text-gray-900">{analytics.overview.totalTrials}</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-600 font-medium">Converted</p>
          <p className="text-3xl font-bold mt-2 text-green-600">{analytics.overview.convertedTrials}</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-600 font-medium">Conversion Rate</p>
          <p className="text-3xl font-bold mt-2 text-blue-600">{analytics.overview.conversionRate}%</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-600 font-medium">Avg Days to Convert</p>
          <p className="text-3xl font-bold mt-2 text-purple-600">{analytics.overview.avgDaysToConvert}</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-600 font-medium">Expiring Soon</p>
          <p className="text-3xl font-bold mt-2 text-yellow-600">{analytics.overview.trialsExpiringSoon}</p>
          <p className="text-xs text-gray-600 mt-1">&lt; 3 days remaining</p>
        </div>
      </div>

      {/* Status Breakdown */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Trial Status Breakdown</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="text-center">
            <p className="text-3xl font-bold text-blue-600">{analytics.statusBreakdown.trialing}</p>
            <p className="text-sm text-gray-600 mt-1">Active Trials</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-orange-600">{analytics.statusBreakdown.grace_period}</p>
            <p className="text-sm text-gray-600 mt-1">Grace Period</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-red-600">{analytics.statusBreakdown.expired}</p>
            <p className="text-sm text-gray-600 mt-1">Expired</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-green-600">{analytics.statusBreakdown.converted}</p>
            <p className="text-sm text-gray-600 mt-1">Converted</p>
          </div>
        </div>

        {/* Visual Bar Chart */}
        <div className="mt-6">
          <div className="flex h-8 rounded-lg overflow-hidden">
            {analytics.overview.totalTrials > 0 && (
              <>
                <div
                  className="bg-blue-500 flex items-center justify-center text-white text-xs font-medium"
                  style={{
                    width: `${(analytics.statusBreakdown.trialing / analytics.overview.totalTrials) * 100}%`,
                  }}
                >
                  {analytics.statusBreakdown.trialing > 0 && analytics.statusBreakdown.trialing}
                </div>
                <div
                  className="bg-orange-500 flex items-center justify-center text-white text-xs font-medium"
                  style={{
                    width: `${(analytics.statusBreakdown.grace_period / analytics.overview.totalTrials) * 100}%`,
                  }}
                >
                  {analytics.statusBreakdown.grace_period > 0 && analytics.statusBreakdown.grace_period}
                </div>
                <div
                  className="bg-red-500 flex items-center justify-center text-white text-xs font-medium"
                  style={{
                    width: `${(analytics.statusBreakdown.expired / analytics.overview.totalTrials) * 100}%`,
                  }}
                >
                  {analytics.statusBreakdown.expired > 0 && analytics.statusBreakdown.expired}
                </div>
                <div
                  className="bg-green-500 flex items-center justify-center text-white text-xs font-medium"
                  style={{
                    width: `${(analytics.statusBreakdown.converted / analytics.overview.totalTrials) * 100}%`,
                  }}
                >
                  {analytics.statusBreakdown.converted > 0 && analytics.statusBreakdown.converted}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Recent Conversions */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Recent Conversions</h2>
            <p className="text-sm text-gray-600 mt-1">{analytics.recentConversions} conversions in the last 7 days</p>
          </div>
          <Link href="/admin/trials" className="text-sm text-blue-600 hover:underline">
            Manage Trials →
          </Link>
        </div>

        {analytics.conversions.length === 0 ? (
          <div className="p-6 text-center text-gray-600">No conversions yet</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Trial Started</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Converted</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Days to Convert</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Plan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {analytics.conversions.map((conversion, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">{conversion.userEmail}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(conversion.trialStart).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(conversion.convertedAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                        {conversion.daysToConvert} days
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {conversion.plan.replace('price_', '').charAt(0).toUpperCase() + conversion.plan.replace('price_', '').slice(1)}
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

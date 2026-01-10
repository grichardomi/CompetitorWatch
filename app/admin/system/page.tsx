'use client';

import { useEffect, useState } from 'react';

interface SystemStats {
  emailQueue: {
    pending: number;
    sent: number;
    failed: number;
  };
  crawlQueue: {
    pending: number;
    total: number;
  };
  webhookEvents: {
    unprocessed: number;
    failed: number;
    recent: Array<{
      id: number;
      source: string;
      eventType: string;
      processed: boolean;
      error: string | null;
      createdAt: string;
    }>;
  };
  database: {
    users: number;
    businesses: number;
    competitors: number;
    alerts: number;
  };
}

export default function AdminSystemPage() {
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/system');

      if (!res.ok) {
        throw new Error('Failed to load system stats');
      }

      const data = await res.json();
      setStats(data);
      setError('');
    } catch (err) {
      console.error('Failed to load system stats:', err);
      setError('Failed to load system stats');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <main className="container mx-auto px-4 sm:px-6 py-8">
        <div className="text-center py-12">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading system stats...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="container mx-auto px-4 sm:px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">System Health</h1>
        <p className="text-gray-600">Monitor queues, webhooks, and database</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {stats && (
        <div className="space-y-6">
          {/* Queue Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Email Queue */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold mb-4">Email Queue</h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Pending</span>
                  <span className="text-2xl font-bold text-blue-600">{stats.emailQueue.pending}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Sent</span>
                  <span className="text-2xl font-bold text-green-600">{stats.emailQueue.sent}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Failed</span>
                  <span className="text-2xl font-bold text-red-600">{stats.emailQueue.failed}</span>
                </div>
              </div>
            </div>

            {/* Crawl Queue */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold mb-4">Crawl Queue</h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Pending</span>
                  <span className="text-2xl font-bold text-blue-600">{stats.crawlQueue.pending}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Total</span>
                  <span className="text-2xl font-bold text-gray-700">{stats.crawlQueue.total}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Webhook Events */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold mb-4">Webhook Events</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                <span className="text-gray-700 font-medium">Unprocessed</span>
                <span className="text-3xl font-bold text-blue-600">{stats.webhookEvents.unprocessed}</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
                <span className="text-gray-700 font-medium">Failed</span>
                <span className="text-3xl font-bold text-red-600">{stats.webhookEvents.failed}</span>
              </div>
            </div>

            {/* Recent Events */}
            <h3 className="text-md font-semibold mb-3">Recent Webhook Events</h3>
            {stats.webhookEvents.recent.length === 0 ? (
              <p className="text-center py-4 text-gray-600">No recent webhook events</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-2 px-3 text-sm font-medium text-gray-600">Source</th>
                      <th className="text-left py-2 px-3 text-sm font-medium text-gray-600">Event Type</th>
                      <th className="text-left py-2 px-3 text-sm font-medium text-gray-600">Status</th>
                      <th className="text-left py-2 px-3 text-sm font-medium text-gray-600">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.webhookEvents.recent.map((event) => (
                      <tr key={event.id} className="border-b border-gray-100">
                        <td className="py-2 px-3 text-sm">{event.source}</td>
                        <td className="py-2 px-3 text-sm">{event.eventType}</td>
                        <td className="py-2 px-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            event.processed && !event.error
                              ? 'bg-green-100 text-green-700'
                              : event.error
                              ? 'bg-red-100 text-red-700'
                              : 'bg-blue-100 text-blue-700'
                          }`}>
                            {event.processed ? (event.error ? 'Failed' : 'Processed') : 'Pending'}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-sm text-gray-600">
                          {new Date(event.createdAt).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Database Stats */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold mb-4">Database Records</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-gray-600 text-sm mb-1">Users</p>
                <p className="text-3xl font-bold text-gray-900">{stats.database.users}</p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-gray-600 text-sm mb-1">Businesses</p>
                <p className="text-3xl font-bold text-gray-900">{stats.database.businesses}</p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-gray-600 text-sm mb-1">Competitors</p>
                <p className="text-3xl font-bold text-gray-900">{stats.database.competitors}</p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-gray-600 text-sm mb-1">Alerts</p>
                <p className="text-3xl font-bold text-gray-900">{stats.database.alerts}</p>
              </div>
            </div>
          </div>

          {/* Refresh Button */}
          <button
            onClick={loadStats}
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Refresh Stats
          </button>
        </div>
      )}
    </main>
  );
}

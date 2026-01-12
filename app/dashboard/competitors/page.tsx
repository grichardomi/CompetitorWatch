'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { formatRelativeTime, getHostname } from '@/lib/utils/format';

interface Competitor {
  id: number;
  name: string;
  url: string;
  isActive: boolean;
  crawlFrequencyMinutes: number;
  lastCrawledAt?: Date;
  createdAt: Date;
  _count: {
    alerts: number;
    priceSnapshots: number;
  };
}

interface ListResponse {
  competitors: Competitor[];
  limit: number;
  plan: string;
  currentCount: number;
}

export default function CompetitorsPage() {
  const { status } = useSession();
  const router = useRouter();
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [subscriptionInfo, setSubscriptionInfo] = useState<{
    limit: number;
    plan: string;
  } | null>(null);
  const [error, setError] = useState('');
  const [deleteModal, setDeleteModal] = useState<{
    show: boolean;
    competitorId: number | null;
    competitorName: string;
  }>({ show: false, competitorId: null, competitorName: '' });
  const [displayLimit, setDisplayLimit] = useState(10);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    } else if (status === 'authenticated') {
      loadCompetitors();
    }
  }, [status, router]);

  const loadCompetitors = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/competitors');
      if (!res.ok) throw new Error('Failed to load competitors');

      const data: ListResponse = await res.json();
      setCompetitors(data.competitors);
      setSubscriptionInfo({ limit: data.limit, plan: data.plan });
      setError('');
    } catch (err) {
      console.error('Failed to load competitors:', err);
      setError('Failed to load competitors');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteModal.competitorId) return;

    try {
      const res = await fetch(`/api/competitors/${deleteModal.competitorId}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Failed to delete competitor');

      setDeleteModal({ show: false, competitorId: null, competitorName: '' });
      loadCompetitors();
    } catch (err) {
      console.error('Failed to delete competitor:', err);
      setError('Failed to delete competitor');
    }
  };

  const toggleActive = async (id: number, currentStatus: boolean) => {
    try {
      const res = await fetch(`/api/competitors/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentStatus }),
      });

      if (!res.ok) throw new Error('Failed to update competitor');

      loadCompetitors();
    } catch (err) {
      console.error('Failed to toggle competitor:', err);
      setError('Failed to update competitor');
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading competitors...</p>
        </div>
      </div>
    );
  }

  const activeCount = competitors.filter((c) => c.isActive).length;
  const alertCount = competitors.reduce((sum, c) => sum + c._count.alerts, 0);
  const atLimit =
    subscriptionInfo && competitors.length >= subscriptionInfo.limit;

  return (
    <>
      <main className="container mx-auto px-4 sm:px-6 py-8 pb-20 md:pb-8">
        {/* Error message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {/* Subscription Limit Indicator */}
        {subscriptionInfo && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-900 font-medium">
                  {competitors.length} / {subscriptionInfo.limit} Competitors
                </p>
                <p className="text-xs text-blue-700">
                  {subscriptionInfo.limit - competitors.length} remaining on{' '}
                  {subscriptionInfo.plan} plan
                </p>
              </div>
              {atLimit && (
                <Link href="/pricing" className="text-sm text-blue-600 hover:underline">
                  Upgrade Plan
                </Link>
              )}
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <p className="text-sm text-gray-600 font-medium">Total Competitors</p>
            <p className="text-4xl font-bold mt-2">{competitors.length}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <p className="text-sm text-gray-600 font-medium">Active Monitoring</p>
            <p className="text-4xl font-bold mt-2 text-green-600">{activeCount}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <p className="text-sm text-gray-600 font-medium">Unread Alerts</p>
            <p className="text-4xl font-bold mt-2 text-red-600">{alertCount}</p>
          </div>
        </div>

        {/* Competitors Grid */}
        {competitors.length === 0 ? (
          <div className="text-center py-12 bg-white border border-gray-200 rounded-lg">
            <div className="text-6xl mb-4">👥</div>
            <h3 className="text-xl font-semibold mb-2 text-gray-900">
              No competitors yet
            </h3>
            <p className="text-gray-600 mb-6">
              Start monitoring your competitors by adding their websites
            </p>
            <Link href="/dashboard/competitors/new">
              <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
                + Add Your First Competitor
              </button>
            </Link>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {competitors.slice(0, displayLimit).map((competitor) => (
              <div
                key={competitor.id}
                className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-lg text-gray-900 truncate">
                      {competitor.name}
                    </h3>
                    <a
                      href={competitor.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline truncate block"
                    >
                      {getHostname(competitor.url)}
                    </a>
                  </div>
                  <span
                    className={`ml-2 px-2 py-1 text-xs rounded-full font-medium whitespace-nowrap ${
                      competitor.isActive
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {competitor.isActive ? 'Active' : 'Paused'}
                  </span>
                </div>

                {/* Metadata */}
                <div className="space-y-2 mb-6 text-sm text-gray-600">
                  <div className="flex items-center">
                    <span className="mr-2">🔔</span>
                    {competitor._count.alerts} unread alerts
                  </div>
                  <div className="flex items-center">
                    <span className="mr-2">📊</span>
                    {competitor._count.priceSnapshots} snapshots
                  </div>
                  <div className="flex items-center">
                    <span className="mr-2">🕐</span>
                    {competitor.lastCrawledAt
                      ? `Crawled ${formatRelativeTime(competitor.lastCrawledAt)}`
                      : 'Never crawled'}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2">
                  <Link
                    href={`/dashboard/competitors/${competitor.id}`}
                    className="w-full px-4 py-2 bg-blue-600 text-white text-center rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                  >
                    View Details
                  </Link>
                  <div className="flex gap-2">
                    <button
                      onClick={() =>
                        toggleActive(competitor.id, competitor.isActive)
                      }
                      className="flex-1 px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                    >
                      {competitor.isActive ? 'Pause' : 'Resume'}
                    </button>
                    <button
                      onClick={() =>
                        setDeleteModal({
                          show: true,
                          competitorId: competitor.id,
                          competitorName: competitor.name,
                        })
                      }
                      className="flex-1 px-3 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors text-sm font-medium"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
              ))}
            </div>

            {/* Load More Button */}
            {competitors.length > displayLimit && (
              <div className="mt-8 text-center">
                <button
                  onClick={() => setDisplayLimit(prev => prev + 10)}
                  className="px-8 py-3 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors border border-blue-200 hover:border-blue-300"
                >
                  Load More ({competitors.length - displayLimit} remaining)
                </button>
              </div>
            )}
          </>
        )}
      </main>

      {/* Delete Confirmation Modal */}
      {deleteModal.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-2 text-gray-900">
              Delete Competitor?
            </h3>
            <p className="text-gray-600 mb-6">
              This will permanently delete <strong>{deleteModal.competitorName}</strong> and all
              associated alerts and price snapshots. This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() =>
                  setDeleteModal({ show: false, competitorId: null, competitorName: '' })
                }
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

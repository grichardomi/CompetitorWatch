'use client';

import { useSession } from 'next-auth/react';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  formatRelativeTime,
  calculateNextCrawl,
} from '@/lib/utils/format';

interface Alert {
  id: number;
  message: string;
  alertType: string;
  isRead: boolean;
  createdAt: string;
}

interface Snapshot {
  id: number;
  extractedData: string;
  capturedAt: string;
}

interface Competitor {
  id: number;
  name: string;
  url: string;
  isActive: boolean;
  crawlFrequencyMinutes: number;
  lastCrawledAt?: string;
  createdAt: string;
  alerts: Alert[];
  priceSnapshots: Snapshot[];
}

export default function CompetitorDetailPage() {
  const { status } = useSession();
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [competitor, setCompetitor] = useState<Competitor | null>(null);

  // Redirect if not authenticated
  if (status === 'unauthenticated') {
    router.push('/auth/signin');
  }

  // Load competitor data
  useEffect(() => {
    if (status === 'authenticated' && id) {
      loadCompetitorData();
    }
  }, [status, id]);

  const loadCompetitorData = async () => {
    if (!id) return;

    try {
      setLoading(true);
      const res = await fetch(`/api/competitors/${id}`);

      if (!res.ok) {
        if (res.status === 404) {
          router.push('/dashboard/competitors');
          return;
        }
        throw new Error('Failed to load competitor');
      }

      const data = await res.json();
      setCompetitor(data);
      setError('');
    } catch (err) {
      console.error('Failed to load competitor:', err);
      setError('Failed to load competitor');
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading competitor details...</p>
        </div>
      </div>
    );
  }

  if (!competitor) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600">Competitor not found</p>
        </div>
      </div>
    );
  }

  return (
      <main className="container mx-auto px-4 sm:px-6 py-8 pb-20 md:pb-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {/* Competitor Header */}
        <div className="bg-white border-b border-gray-200 mb-8 pb-8">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold mb-2 text-gray-900">
                {competitor.name}
              </h1>
              <a
                href={competitor.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-lg text-blue-600 hover:underline"
              >
                {competitor.url}
              </a>
              <div className="flex items-center gap-4 mt-4">
                <span
                  className={`px-3 py-1 text-sm rounded-full font-medium ${
                    competitor.isActive
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {competitor.isActive ? 'Active' : 'Paused'}
                </span>
                <span className="text-sm text-gray-600">
                  Checking every {competitor.crawlFrequencyMinutes / 60} hours
                </span>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Link href={`/dashboard/competitors/${competitor.id}/edit`}>
                <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium">
                  Edit
                </button>
              </Link>
            </div>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <p className="text-sm text-gray-600 font-medium">Last Checked</p>
            <p className="text-2xl font-bold mt-2">
              {competitor.lastCrawledAt
                ? formatRelativeTime(competitor.lastCrawledAt)
                : 'Never'}
            </p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <p className="text-sm text-gray-600 font-medium">Total Alerts</p>
            <p className="text-2xl font-bold mt-2">{competitor.alerts.length}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <p className="text-sm text-gray-600 font-medium">
              Price Snapshots
            </p>
            <p className="text-2xl font-bold mt-2">
              {competitor.priceSnapshots.length}
            </p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <p className="text-sm text-gray-600 font-medium">Next Check</p>
            <p className="text-2xl font-bold mt-2">
              {calculateNextCrawl(
                competitor.lastCrawledAt || null,
                competitor.crawlFrequencyMinutes
              )}
            </p>
          </div>
        </div>

        {/* Recent Alerts */}
        <div className="bg-white border border-gray-200 rounded-lg p-8 mb-8">
          <h2 className="text-2xl font-bold mb-6">Recent Alerts</h2>
          {competitor.alerts.length === 0 ? (
            <p className="text-gray-600 text-center py-12">No alerts yet</p>
          ) : (
            <div className="space-y-3">
              {competitor.alerts.map((alert) => (
                <div
                  key={alert.id}
                  className="flex items-start gap-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div
                    className={`w-3 h-3 rounded-full mt-1.5 ${
                      alert.alertType === 'price_change'
                        ? 'bg-blue-500'
                        : alert.alertType === 'new_promotion'
                          ? 'bg-green-500'
                          : 'bg-purple-500'
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900">{alert.message}</p>
                    <p className="text-sm text-gray-600">
                      {formatRelativeTime(alert.createdAt)}
                    </p>
                  </div>
                  {!alert.isRead && (
                    <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full font-medium whitespace-nowrap">
                      New
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Price History */}
        <div className="bg-white border border-gray-200 rounded-lg p-8 mb-8">
          <h2 className="text-2xl font-bold mb-6">Price History</h2>
          {competitor.priceSnapshots.length < 2 ? (
            <p className="text-gray-600 text-center py-12">
              Not enough data yet. Check back after a few crawls.
            </p>
          ) : (
            <div className="space-y-2">
              {competitor.priceSnapshots.slice(0, 20).map((snapshot, idx) => {
                let extractedData: any = {};
                try {
                  extractedData = JSON.parse(snapshot.extractedData);
                } catch (e) {
                  // Invalid JSON, skip
                }

                const currentPrice = extractedData.price;
                const prevSnapshot = competitor.priceSnapshots[idx + 1];
                let prevPrice = null;

                if (prevSnapshot) {
                  try {
                    prevPrice = JSON.parse(prevSnapshot.extractedData).price;
                  } catch (e) {
                    // Invalid JSON
                  }
                }

                const priceChanged =
                  prevPrice &&
                  currentPrice &&
                  parseFloat(currentPrice) !== parseFloat(prevPrice);
                const priceIncreased =
                  priceChanged &&
                  parseFloat(currentPrice) > parseFloat(prevPrice);

                return (
                  <div
                    key={snapshot.id}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                  >
                    <span className="text-sm text-gray-600 font-medium">
                      {new Date(snapshot.capturedAt).toLocaleDateString(
                        'en-US',
                        {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        }
                      )}
                    </span>
                    <span className="font-semibold text-gray-900">
                      {currentPrice ? `$${currentPrice}` : 'N/A'}
                    </span>
                    {priceChanged && (
                      <span
                        className={`text-sm font-semibold ${
                          priceIncreased
                            ? 'text-red-600'
                            : 'text-green-600'
                        }`}
                      >
                        {priceIncreased ? '↑' : '↓'} {Math.abs(
                          parseFloat(currentPrice) - parseFloat(prevPrice)
                        ).toFixed(2)}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Additional Info */}
        <div className="bg-white border border-gray-200 rounded-lg p-8">
          <h2 className="text-2xl font-bold mb-6">Information</h2>
          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="text-gray-600">Created</span>
              <span className="font-medium text-gray-900">
                {new Date(competitor.createdAt).toLocaleDateString()}
              </span>
            </div>
            <div className="flex justify-between border-t border-gray-200 pt-4">
              <span className="text-gray-600">Check Frequency</span>
              <span className="font-medium text-gray-900">
                Every {competitor.crawlFrequencyMinutes / 60} hours
              </span>
            </div>
            <div className="flex justify-between border-t border-gray-200 pt-4">
              <span className="text-gray-600">Total Crawls</span>
              <span className="font-medium text-gray-900">
                {competitor.priceSnapshots.length}
              </span>
            </div>
          </div>
        </div>
      </main>
  );
}

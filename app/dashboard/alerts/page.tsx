'use client';

import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import { formatRelativeTime } from '@/lib/utils/format';

interface Alert {
  id: number;
  alertType: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  competitor?: {
    id: number;
    name: string;
    url: string;
  } | null;
}

interface FilterOption {
  type?: string;
  id?: number;
  label?: string;
  name?: string;
  value?: string;
  count: number;
}

interface AlertsResponse {
  alerts: Alert[];
  total: number;
  pagination: {
    limit: number;
    offset: number;
    hasMore: boolean;
  };
  filters: {
    alertTypes: FilterOption[];
    competitors: FilterOption[];
    readStatus: FilterOption[];
  };
}

const ALERT_TYPE_COLORS: Record<string, { bg: string; text: string; icon: string }> = {
  price_change: { bg: 'bg-blue-100', text: 'text-blue-700', icon: '💰' },
  new_promotion: { bg: 'bg-green-100', text: 'text-green-700', icon: '🎉' },
  menu_change: { bg: 'bg-purple-100', text: 'text-purple-700', icon: '📋' },
};

export default function AlertsPage() {
  const { status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterData, setFilterData] = useState<AlertsResponse['filters'] | null>(null);
  const [total, setTotal] = useState(0);
  const [selectedAlerts, setSelectedAlerts] = useState<Set<number>>(new Set());

  // Filters
  const [alertType, setAlertType] = useState(searchParams.get('alertType') || 'all');
  const [isRead, setIsRead] = useState(searchParams.get('isRead') || 'all');
  const [competitorId, setCompetitorId] = useState(searchParams.get('competitorId') || 'all');
  const [dateFrom, setDateFrom] = useState(searchParams.get('dateFrom') || '');
  const [dateTo, setDateTo] = useState(searchParams.get('dateTo') || '');
  const [page, setPage] = useState(parseInt(searchParams.get('page') || '1'));
  const [sortBy, setSortBy] = useState(searchParams.get('sortBy') || 'createdAt');
  const [sortOrder, setSortOrder] = useState(searchParams.get('sortOrder') || 'desc');

  const limit = 20;
  const offset = (page - 1) * limit;

  // Redirect if not authenticated
  if (status === 'unauthenticated') {
    router.push('/auth/signin');
  }

  // Load alerts
  useEffect(() => {
    if (status === 'authenticated') {
      loadAlerts();
    }
  }, [status, alertType, isRead, competitorId, dateFrom, dateTo, page, sortBy, sortOrder]);

  const loadAlerts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: offset.toString(),
        alertType: alertType !== 'all' ? alertType : '',
        isRead: isRead !== 'all' ? isRead : '',
        competitorId: competitorId !== 'all' ? competitorId : '',
        dateFrom: dateFrom || '',
        dateTo: dateTo || '',
        sortBy,
        sortOrder,
      });

      const res = await fetch(`/api/alerts?${params}`);
      if (!res.ok) throw new Error('Failed to load alerts');

      const data: AlertsResponse = await res.json();
      setAlerts(data.alerts);
      setTotal(data.total);
      setFilterData(data.filters);
      setError('');
    } catch (err) {
      console.error('Failed to load alerts:', err);
      setError('Failed to load alerts');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAlert = (alertId: number) => {
    const newSet = new Set(selectedAlerts);
    if (newSet.has(alertId)) {
      newSet.delete(alertId);
    } else {
      newSet.add(alertId);
    }
    setSelectedAlerts(newSet);
  };

  const handleSelectAll = () => {
    if (selectedAlerts.size === alerts.length) {
      setSelectedAlerts(new Set());
    } else {
      setSelectedAlerts(new Set(alerts.map((a) => a.id)));
    }
  };

  const handleMarkAsRead = async () => {
    if (selectedAlerts.size === 0) return;

    try {
      const res = await fetch('/api/alerts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          alertIds: Array.from(selectedAlerts),
          isRead: true,
        }),
      });

      if (!res.ok) throw new Error('Failed to update alerts');

      setSelectedAlerts(new Set());
      loadAlerts();
    } catch (err) {
      console.error('Failed to update alerts:', err);
      setError('Failed to update alerts');
    }
  };

  const handleClearFilters = () => {
    setAlertType('all');
    setIsRead('all');
    setCompetitorId('all');
    setDateFrom('');
    setDateTo('');
    setPage(1);
  };

  const hasActiveFilters =
    alertType !== 'all' ||
    isRead !== 'all' ||
    competitorId !== 'all' ||
    dateFrom ||
    dateTo;

  const totalPages = Math.ceil(total / limit);

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading alerts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-0">
      <Header />

      {/* Main Content */}
      <main className="container mx-auto px-4 sm:px-6 py-8 pb-20 md:pb-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Alerts</h1>
          <p className="text-gray-600">
            {total} {total === 1 ? 'alert' : 'alerts'} found
          </p>
        </div>

        {/* Filters Section */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold">Filters</h2>
            {hasActiveFilters && (
              <button
                onClick={handleClearFilters}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Clear all
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Alert Type Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Alert Type
              </label>
              <select
                value={alertType}
                onChange={(e) => {
                  setAlertType(e.target.value);
                  setPage(1);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
              >
                <option value="all">All Types</option>
                {filterData?.alertTypes.map((at) => (
                  <option key={at.type} value={at.type}>
                    {at.type?.replace('_', ' ') || 'Unknown'} ({at.count})
                  </option>
                ))}
              </select>
            </div>

            {/* Read Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Status
              </label>
              <select
                value={isRead}
                onChange={(e) => {
                  setIsRead(e.target.value);
                  setPage(1);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
              >
                <option value="all">All</option>
                <option value="false">Unread</option>
                <option value="true">Read</option>
              </select>
            </div>

            {/* Competitor Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Competitor
              </label>
              <select
                value={competitorId}
                onChange={(e) => {
                  setCompetitorId(e.target.value);
                  setPage(1);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
              >
                <option value="all">All Competitors</option>
                {filterData?.competitors.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.count})
                  </option>
                ))}
              </select>
            </div>

            {/* Date From Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                From
              </label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => {
                  setDateFrom(e.target.value);
                  setPage(1);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
              />
            </div>

            {/* Date To Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                To
              </label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => {
                  setDateTo(e.target.value);
                  setPage(1);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
              />
            </div>
          </div>

          {/* Sort Options */}
          <div className="mt-4 pt-4 border-t border-gray-200 flex items-center gap-4">
            <label className="text-sm font-medium text-gray-900">Sort by:</label>
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
            >
              <option value="createdAt">Date</option>
              <option value="alertType">Type</option>
            </select>

            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
            >
              <option value="desc">Newest</option>
              <option value="asc">Oldest</option>
            </select>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedAlerts.size > 0 && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-900">
                {selectedAlerts.size} alert{selectedAlerts.size !== 1 ? 's' : ''} selected
              </p>
            </div>
            <button
              onClick={handleMarkAsRead}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              Mark as Read
            </button>
          </div>
        )}

        {/* Alerts List */}
        {alerts.length === 0 ? (
          <div className="text-center py-12 bg-white border border-gray-200 rounded-lg">
            <div className="text-6xl mb-4">🔔</div>
            <h3 className="text-xl font-semibold mb-2 text-gray-900">No alerts yet</h3>
            <p className="text-gray-600">
              {hasActiveFilters
                ? 'No alerts match your filters. Try adjusting them.'
                : 'Alerts will appear here when your competitors have changes.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Header Row */}
            <div className="hidden md:flex items-center gap-4 px-6 py-3 bg-gray-100 rounded-lg">
              <input
                type="checkbox"
                checked={selectedAlerts.size === alerts.length && alerts.length > 0}
                onChange={handleSelectAll}
                className="w-4 h-4 text-blue-600 rounded"
              />
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-700">Alert</p>
              </div>
              <div className="w-32">
                <p className="text-sm font-semibold text-gray-700">Type</p>
              </div>
              <div className="w-32">
                <p className="text-sm font-semibold text-gray-700">Date</p>
              </div>
            </div>

            {/* Alert Items */}
            {alerts.map((alert) => {
              const alertColor = ALERT_TYPE_COLORS[alert.alertType] || {
                bg: 'bg-gray-100',
                text: 'text-gray-700',
                icon: '📌',
              };

              return (
                <div
                  key={alert.id}
                  className={`border rounded-lg p-4 transition-colors ${
                    selectedAlerts.has(alert.id)
                      ? 'bg-blue-50 border-blue-300'
                      : 'bg-white border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    {/* Checkbox */}
                    <input
                      type="checkbox"
                      checked={selectedAlerts.has(alert.id)}
                      onChange={() => handleSelectAlert(alert.id)}
                      className="w-4 h-4 text-blue-600 rounded mt-1"
                    />

                    {/* Main Content */}
                    <div className="flex-1 min-w-0">
                      {/* Title and Status */}
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <p className="font-medium text-gray-900 break-words">{alert.message}</p>
                        {!alert.isRead && (
                          <span className="flex-shrink-0 px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full font-medium whitespace-nowrap">
                            New
                          </span>
                        )}
                      </div>

                      {/* Competitor Info */}
                      {alert.competitor && (
                        <div className="mb-3">
                          <Link
                            href={`/dashboard/competitors/${alert.competitor.id}`}
                            className="text-sm text-blue-600 hover:underline"
                          >
                            {alert.competitor.name}
                          </Link>
                        </div>
                      )}

                      {/* Alert Type and Date */}
                      <div className="flex flex-wrap items-center gap-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${alertColor.bg} ${alertColor.text}`}
                        >
                          <span>{alertColor.icon}</span>
                          {alert.alertType.replace('_', ' ')}
                        </span>
                        <span className="text-xs text-gray-600">
                          {formatRelativeTime(alert.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-8 flex items-center justify-between">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              ← Previous
            </button>

            <div className="flex items-center gap-2">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum: number;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (page <= 3) {
                  pageNum = i + 1;
                } else if (page >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = page - 2 + i;
                }

                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={`w-10 h-10 rounded-lg font-medium transition-colors ${
                      page === pageNum
                        ? 'bg-blue-600 text-white'
                        : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              Next →
            </button>
          </div>
        )}
      </main>

    </div>
  );
}

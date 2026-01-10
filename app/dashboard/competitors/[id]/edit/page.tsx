'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Competitor {
  id: number;
  name: string;
  url: string;
  crawlFrequencyMinutes: number;
  isActive: boolean;
}

export default function EditCompetitorPage({
  params,
}: {
  params: { id: string };
}) {
  const { status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [competitor, setCompetitor] = useState<Competitor | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    url: '',
    crawlFrequencyMinutes: 720,
    isActive: true,
  });

  // Redirect if not authenticated
  if (status === 'unauthenticated') {
    router.push('/auth/signin');
  }

  // Load competitor data
  useEffect(() => {
    if (status === 'authenticated') {
      loadCompetitor();
    }
  }, [status, params.id]);

  const loadCompetitor = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/competitors/${params.id}`);

      if (!res.ok) {
        if (res.status === 404) {
          router.push('/dashboard/competitors');
          return;
        }
        throw new Error('Failed to load competitor');
      }

      const data = await res.json();
      setCompetitor(data);
      setFormData({
        name: data.name,
        url: data.url,
        crawlFrequencyMinutes: data.crawlFrequencyMinutes,
        isActive: data.isActive,
      });
      setError('');
    } catch (err) {
      console.error('Failed to load competitor:', err);
      setError('Failed to load competitor');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const res = await fetch(`/api/competitors/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update competitor');
      }

      router.push(`/dashboard/competitors/${params.id}`);
    } catch (err) {
      console.error('Failed to update competitor:', err);
      setError(err instanceof Error ? err.message : 'Failed to update competitor');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      setSaving(true);
      const res = await fetch(`/api/competitors/${params.id}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Failed to delete competitor');

      router.push('/dashboard/competitors');
    } catch (err) {
      console.error('Failed to delete competitor:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete competitor');
    } finally {
      setSaving(false);
      setDeleteModalOpen(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading competitor...</p>
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="container mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-2xl font-bold text-blue-600">
              CompetitorWatch
            </Link>

            {/* Back Button */}
            <button
              onClick={() => router.back()}
              className="text-gray-600 hover:text-gray-900 font-medium"
            >
              ← Back
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 sm:px-6 py-8 pb-20 md:pb-8">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold mb-2">Edit Competitor</h1>
              <p className="text-gray-600">Update {competitor.name}</p>
            </div>
            <button
              onClick={() => setDeleteModalOpen(true)}
              className="px-4 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors font-medium"
            >
              Delete
            </button>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className="bg-white border border-gray-200 rounded-lg p-8"
          >
            {/* Competitor Name */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Competitor Name *
              </label>
              <input
                type="text"
                required
                minLength={2}
                maxLength={100}
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="e.g., Acme Coffee Shop"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            {/* Website URL */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Website URL *
              </label>
              <input
                type="url"
                required
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                placeholder="https://competitor.com or competitor.com"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            {/* Crawl Frequency */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Check Frequency
              </label>
              <select
                value={formData.crawlFrequencyMinutes}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    crawlFrequencyMinutes: parseInt(e.target.value),
                  })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value={360}>Every 6 hours</option>
                <option value={720}>Every 12 hours (recommended)</option>
                <option value={1440}>Every 24 hours</option>
                <option value={2880}>Every 48 hours</option>
              </select>
            </div>

            {/* Active Status Toggle */}
            <div className="mb-8">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) =>
                    setFormData({ ...formData, isActive: e.target.checked })
                  }
                  className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-2 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700 font-medium">
                  Monitoring enabled
                </span>
              </label>
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => router.back()}
                disabled={saving}
                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </main>

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-2 text-gray-900">
              Delete Competitor?
            </h3>
            <p className="text-gray-600 mb-6">
              This will permanently delete <strong>{competitor.name}</strong> and all
              associated alerts and price snapshots. This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteModalOpen(false)}
                disabled={saving}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={saving}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50"
              >
                {saving ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import Link from 'next/link';

export default function NewCompetitorPage() {
  const { status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/competitors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create competitor');
      }

      router.push('/dashboard/competitors');
    } catch (err) {
      console.error('Failed to create competitor:', err);
      setError(err instanceof Error ? err.message : 'Failed to create competitor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="container mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-2xl font-bold text-blue-600">
              MarketPulse
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
          <h1 className="text-3xl font-bold mb-2">Add New Competitor</h1>
          <p className="text-gray-600 mb-8">
            Enter details about the competitor you want to monitor
          </p>

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
              <p className="text-xs text-gray-600 mt-1">
                Give your competitor a recognizable name
              </p>
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
              <p className="text-xs text-gray-600 mt-1">
                We'll monitor this URL for pricing and content changes
              </p>
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
              <p className="text-xs text-gray-600 mt-1">
                How often we'll check the website for changes
              </p>
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
                  Start monitoring immediately
                </span>
              </label>
              <p className="text-xs text-gray-600 mt-1 ml-6">
                You can pause monitoring anytime from the competitors list
              </p>
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => router.back()}
                disabled={loading}
                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
              >
                {loading ? 'Adding...' : 'Add Competitor'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}

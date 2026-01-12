'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { INDUSTRY_METADATA, type Industry } from '@/lib/config/industries';

interface Business {
  id: number;
  name: string;
  location: string;
  industry: Industry;
  createdAt: string;
  updatedAt: string;
}

export default function BusinessSettingsPage() {
  const { status } = useSession();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [business, setBusiness] = useState<Business | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');

  // Industry change modal state
  const [showIndustryModal, setShowIndustryModal] = useState(false);
  const [selectedIndustry, setSelectedIndustry] = useState<Industry | ''>('');
  const [changingIndustry, setChangingIndustry] = useState(false);

  // Redirect if not authenticated
  if (status === 'unauthenticated') {
    router.push('/auth/signin');
  }

  // Load business
  useEffect(() => {
    if (status === 'authenticated') {
      loadBusiness();
    }
  }, [status]);

  const loadBusiness = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/business');
      if (!res.ok) throw new Error('Failed to load business');

      const data: Business = await res.json();
      setBusiness(data);

      // Update form state
      setName(data.name);
      setLocation(data.location);
      setError('');
      setHasChanges(false);
    } catch (err) {
      console.error('Failed to load business:', err);
      setError('Failed to load business information');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveBusiness = async () => {
    try {
      setSaving(true);
      setError('');
      setSuccess('');

      const res = await fetch('/api/business', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, location }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to update business');
      }

      setBusiness(data.business);
      setHasChanges(false);
      setSuccess('Business settings updated successfully!');

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Failed to save business:', err);
      setError(err instanceof Error ? err.message : 'Failed to save business settings');
    } finally {
      setSaving(false);
    }
  };

  const handleChangeIndustry = async () => {
    if (!selectedIndustry || !business) return;

    try {
      setChangingIndustry(true);
      setError('');

      const res = await fetch('/api/business/industry', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          newIndustry: selectedIndustry,
          confirmed: true,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to update industry');
      }

      // Update local state
      setBusiness({ ...business, industry: selectedIndustry });
      setSuccess('Business industry updated successfully!');
      setShowIndustryModal(false);
      setSelectedIndustry('');

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Failed to change industry:', err);
      setError(err instanceof Error ? err.message : 'Failed to update industry');
    } finally {
      setChangingIndustry(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading business settings...</p>
        </div>
      </div>
    );
  }

  const industryMetadata = business ? INDUSTRY_METADATA[business.industry] : null;

  return (
    <>
      <main className="container mx-auto px-4 sm:px-6 py-8 max-w-4xl pb-20 md:pb-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
            ✓ {success}
          </div>
        )}

        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Business Settings</h1>
          <p className="text-gray-600">Manage your business information and monitoring preferences</p>
        </div>

        <div className="space-y-8">
          {/* Business Information */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Business Information</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Business Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    setHasChanges(true);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="Your business name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => {
                    setLocation(e.target.value);
                    setHasChanges(true);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="City, State or Address"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Industry
                </label>
                <div className="flex gap-3">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={industryMetadata?.label || business?.industry || ''}
                      disabled
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <svg
                        className="w-5 h-5 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                        />
                      </svg>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowIndustryModal(true)}
                    className="px-4 py-2 text-sm font-medium text-orange-700 bg-orange-50 border border-orange-200 rounded-lg hover:bg-orange-100 transition-colors"
                  >
                    Change...
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Only change if your business type has fundamentally changed
                </p>
              </div>
            </div>
          </div>

          {/* Industry Lock Policy */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <div className="flex gap-3">
              <div className="flex-shrink-0">
                <svg
                  className="w-6 h-6 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-blue-900 mb-2">Why can&apos;t I change my industry?</h3>
                <p className="text-sm text-blue-800 mb-3">
                  Your industry setting determines how we extract and analyze competitor data. Changing it
                  after onboarding would invalidate existing data and break historical comparisons.
                </p>
                <p className="text-sm text-blue-800">
                  If you need to change your industry, please{' '}
                  <a href="mailto:support@marketpulse.com" className="underline font-medium">
                    contact support
                  </a>{' '}
                  and we&apos;ll help you migrate your account.
                </p>
              </div>
            </div>
          </div>

          {/* Metadata Display */}
          {industryMetadata && (
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Industry Details</h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between py-2">
                  <span className="text-gray-600">Industry Type</span>
                  <span className="font-medium">{industryMetadata.label}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-gray-600">Description</span>
                  <span className="font-medium text-right max-w-xs">{industryMetadata.description}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-gray-600">Price Tracking</span>
                  <span className="font-medium">
                    {industryMetadata.publishablePrices ? (
                      <span className="text-green-600">✓ Enabled</span>
                    ) : (
                      <span className="text-gray-600">Not Available</span>
                    )}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Save Buttons */}
          <div className="flex gap-3">
            <button
              onClick={() => loadBusiness()}
              disabled={saving || !hasChanges}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Discard Changes
            </button>
            <button
              onClick={handleSaveBusiness}
              disabled={saving || !hasChanges}
              className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </main>

      {/* Change Industry Modal */}
      {showIndustryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-lg w-full p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Change Business Industry</h3>
                <p className="text-sm text-gray-600 mt-1">This is a sensitive operation</p>
              </div>
              <button
                onClick={() => {
                  setShowIndustryModal(false);
                  setSelectedIndustry('');
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Warning Banner */}
            <div className="bg-orange-50 border-l-4 border-orange-400 p-4 mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-orange-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h4 className="text-sm font-medium text-orange-800">Warning</h4>
                  <div className="mt-2 text-sm text-orange-700">
                    <p>Changing your business industry will affect:</p>
                    <ul className="list-disc list-inside mt-2 space-y-1">
                      <li>Default competitor detection</li>
                      <li>Industry-specific data extraction</li>
                      <li>Your business profile</li>
                    </ul>
                    <p className="mt-2 font-medium">Only proceed if your business type has fundamentally changed.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Current Industry */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Current Industry</label>
              <div className="px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-700">
                {industryMetadata?.label}
              </div>
            </div>

            {/* New Industry Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">New Industry</label>
              <select
                value={selectedIndustry}
                onChange={(e) => setSelectedIndustry(e.target.value as Industry)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="">-- Select New Industry --</option>
                {Object.entries(INDUSTRY_METADATA).map(([key, meta]) => (
                  <option key={key} value={key} disabled={key === business?.industry}>
                    {meta.label} {key === business?.industry ? '(current)' : ''}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                {selectedIndustry && INDUSTRY_METADATA[selectedIndustry as Industry]?.description}
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowIndustryModal(false);
                  setSelectedIndustry('');
                }}
                disabled={changingIndustry}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleChangeIndustry}
                disabled={!selectedIndustry || changingIndustry}
                className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {changingIndustry ? 'Changing...' : 'Confirm Change'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

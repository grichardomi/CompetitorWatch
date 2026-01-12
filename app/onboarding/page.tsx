'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  getIndustryOptions,
  DEFAULT_INDUSTRY,
  type Industry,
} from '@/lib/config/industries';

type OnboardingStep = 1 | 2 | 3 | 4;

interface BusinessData {
  name: string;
  location: string;
  industry: Industry;
}

interface CompetitorData {
  name: string;
  url: string;
}

interface PreferencesData {
  emailEnabled: boolean;
  emailFrequency: 'instant' | 'daily' | 'weekly';
  alertTypes: string[];
  timezone: string;
}

export default function OnboardingPage() {
  const router = useRouter();
  const { status } = useSession();

  const [step, setStep] = useState<OnboardingStep>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [checkingStatus, setCheckingStatus] = useState(true);

  const [businessData, setBusinessData] = useState<BusinessData>({
    name: '',
    location: '',
    industry: DEFAULT_INDUSTRY,
  });

  const [competitorData, setCompetitorData] = useState<CompetitorData>({
    name: '',
    url: '',
  });

  const [preferencesData, setPreferencesData] = useState<PreferencesData>({
    emailEnabled: true,
    emailFrequency: 'instant',
    alertTypes: ['price_change', 'new_promotion'],
    timezone: 'America/New_York',
  });

  // Check auth status and onboarding completion
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin?callbackUrl=/onboarding');
    } else if (status === 'authenticated') {
      checkOnboardingStatus();
    }
  }, [status, router]);

  const checkOnboardingStatus = async () => {
    try {
      const res = await fetch('/api/onboarding/status');
      const data = await res.json();

      if (data.completed) {
        // User already completed onboarding, redirect to dashboard
        router.push('/dashboard');
      } else {
        setCheckingStatus(false);
      }
    } catch (err) {
      console.error('Failed to check onboarding status:', err);
      setCheckingStatus(false);
    }
  };

  // Business step handler
  const handleBusinessSubmit = async () => {
    if (!businessData.name.trim()) {
      setError('Please enter your business name');
      return;
    }

    if (businessData.name.length < 2) {
      setError('Business name must be at least 2 characters');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/onboarding/business', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(businessData),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to save business');
      }

      setStep(2);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save business');
    } finally {
      setLoading(false);
    }
  };

  // Competitor step handler
  const handleCompetitorSubmit = async () => {
    if (!competitorData.name.trim()) {
      setError('Please enter competitor name');
      return;
    }

    if (!competitorData.url.trim()) {
      setError('Please enter competitor URL');
      return;
    }

    // Basic URL validation
    try {
      new URL(competitorData.url.startsWith('http') ? competitorData.url : `https://${competitorData.url}`);
    } catch {
      setError('Please enter a valid URL');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/onboarding/competitor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(competitorData),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to add competitor');
      }

      setStep(3);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add competitor');
    } finally {
      setLoading(false);
    }
  };

  // Preferences step handler
  const handlePreferencesSubmit = async () => {
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/onboarding/preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(preferencesData),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to save preferences');
      }

      // Move to success step
      setStep(4);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save preferences');
    } finally {
      setLoading(false);
    }
  };

  // Complete onboarding
  const handleComplete = async () => {
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/onboarding/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to complete onboarding');
      }

      // Redirect to dashboard
      setTimeout(() => {
        router.push('/dashboard');
      }, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to complete onboarding');
      setLoading(false);
    }
  };

  if (status === 'loading' || checkingStatus) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Setting up your account...</p>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return null; // Redirecting to signin
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-md mx-auto">
        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center">
                <div className={`
                  w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold
                  ${step === s ? 'bg-blue-600 text-white' :
                    step > s ? 'bg-green-500 text-white' :
                    'bg-gray-200 text-gray-600'}
                `}>
                  {step > s ? '✓' : s}
                </div>
                {s < 3 && (
                  <div className={`flex-1 h-1 mx-2 ${step > s ? 'bg-green-500' : 'bg-gray-200'}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step 1: Business Setup */}
        {step === 1 && (
          <div className="bg-white rounded-lg border border-gray-200 p-8 shadow-sm">
            <h2 className="text-2xl font-bold mb-2">Welcome!</h2>
            <p className="text-gray-600 mb-6">Let&apos;s start by setting up your business</p>

            <form onSubmit={(e) => { e.preventDefault(); handleBusinessSubmit(); }} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Business Name *
                </label>
                <input
                  type="text"
                  value={businessData.name}
                  onChange={(e) => setBusinessData({ ...businessData, name: e.target.value })}
                  placeholder="e.g., My Coffee Shop"
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Location (Optional)
                </label>
                <input
                  type="text"
                  value={businessData.location}
                  onChange={(e) => setBusinessData({ ...businessData, location: e.target.value })}
                  placeholder="e.g., 123 Main St, New York, NY"
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Industry *
                </label>
                <select
                  value={businessData.industry}
                  onChange={(e) =>
                    setBusinessData({ ...businessData, industry: e.target.value as Industry })
                  }
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={loading}
                >
                  {getIndustryOptions().map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-600 mt-1">
                  Select your business industry for better competitor monitoring
                </p>
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Saving...' : 'Continue'}
              </button>
            </form>
          </div>
        )}

        {/* Step 2: Add Competitor */}
        {step === 2 && (
          <div className="bg-white rounded-lg border border-gray-200 p-8 shadow-sm">
            <h2 className="text-2xl font-bold mb-2">Add Your First Competitor</h2>
            <p className="text-gray-600 mb-6">We&apos;ll monitor their website for changes</p>

            <form onSubmit={(e) => { e.preventDefault(); handleCompetitorSubmit(); }} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Competitor Name *
                </label>
                <input
                  type="text"
                  value={competitorData.name}
                  onChange={(e) => setCompetitorData({ ...competitorData, name: e.target.value })}
                  placeholder="e.g., Competitor Coffee"
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Website URL *
                </label>
                <input
                  type="url"
                  value={competitorData.url}
                  onChange={(e) => setCompetitorData({ ...competitorData, url: e.target.value })}
                  placeholder="e.g., https://competitor.com"
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={loading}
                />
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  disabled={loading}
                  className="flex-1 px-4 py-2 border border-gray-200 text-gray-900 rounded-lg font-medium hover:bg-gray-50 disabled:opacity-50 transition-colors"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? 'Saving...' : 'Continue'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Step 3: Notification Preferences */}
        {step === 3 && (
          <div className="bg-white rounded-lg border border-gray-200 p-8 shadow-sm">
            <h2 className="text-2xl font-bold mb-2">Alert Preferences</h2>
            <p className="text-gray-600 mb-6">How would you like to be notified?</p>

            <form onSubmit={(e) => { e.preventDefault(); handlePreferencesSubmit(); }} className="space-y-4">
              <div className="space-y-3">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={preferencesData.emailEnabled}
                    onChange={(e) => setPreferencesData({ ...preferencesData, emailEnabled: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded"
                    disabled={loading}
                  />
                  <span className="ml-2 text-sm text-gray-700">Enable email notifications</span>
                </label>

                {preferencesData.emailEnabled && (
                  <div className="ml-6 space-y-2">
                    <label className="block text-sm font-medium text-gray-900 mb-2">Frequency</label>
                    <select
                      value={preferencesData.emailFrequency}
                      onChange={(e) => setPreferencesData({ ...preferencesData, emailFrequency: e.target.value as 'instant' | 'daily' | 'weekly' })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={loading}
                    >
                      <option value="instant">Instant</option>
                      <option value="daily">Daily Summary</option>
                      <option value="weekly">Weekly Summary</option>
                    </select>
                  </div>
                )}
              </div>

              <div className="border-t pt-4 mt-4">
                <label className="block text-sm font-medium text-gray-900 mb-3">Alert Types</label>
                <div className="space-y-2">
                  {[
                    { id: 'price_change', label: 'Price Changes' },
                    { id: 'new_promotion', label: 'New Promotions' },
                    { id: 'menu_change', label: 'Menu/Service Changes' },
                    { id: 'status_change', label: 'Status Changes' },
                  ].map((type) => (
                    <label key={type.id} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={preferencesData.alertTypes.includes(type.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setPreferencesData({
                              ...preferencesData,
                              alertTypes: [...preferencesData.alertTypes, type.id],
                            });
                          } else {
                            setPreferencesData({
                              ...preferencesData,
                              alertTypes: preferencesData.alertTypes.filter((a) => a !== type.id),
                            });
                          }
                        }}
                        className="w-4 h-4 text-blue-600 rounded"
                        disabled={loading}
                      />
                      <span className="ml-2 text-sm text-gray-700">{type.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  disabled={loading}
                  className="flex-1 px-4 py-2 border border-gray-200 text-gray-900 rounded-lg font-medium hover:bg-gray-50 disabled:opacity-50 transition-colors"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? 'Completing...' : 'Complete Setup'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Step 4: Success */}
        {step === 4 && (
          <div className="bg-white rounded-lg border border-gray-200 p-8 shadow-sm text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold mb-2">You&apos;re all set!</h2>
            <p className="text-gray-600 mb-6">
              Your dashboard is ready. We&apos;ll start monitoring <strong>{competitorData.name}</strong> every 12 hours for changes.
            </p>
            <button
              onClick={handleComplete}
              disabled={loading}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Redirecting...' : 'Go to Dashboard'}
            </button>
            <p className="text-xs text-gray-500 mt-4">
              Redirecting automatically...
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  getIndustryOptions,
  DEFAULT_INDUSTRY,
  type Industry,
} from '@/lib/config/industries';
import CompetitorDiscovery from '@/components/onboarding/CompetitorDiscovery';

type OnboardingStep = 1 | 2 | 3 | 4;

interface BusinessData {
  name: string;
  location: string;
  industry: Industry;
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
  const [competitorLimit, setCompetitorLimit] = useState<number>(3);

  const [businessData, setBusinessData] = useState<BusinessData>({
    name: '',
    location: '',
    industry: DEFAULT_INDUSTRY,
  });

  const [discoveredCompetitors, setDiscoveredCompetitors] = useState<any[]>([]);

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
        // Fetch competitor limit
        const limitRes = await fetch('/api/subscription/limit');
        if (limitRes.ok) {
          const limitData = await limitRes.json();
          setCompetitorLimit(limitData.competitorLimit || 3);
        }
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

  // Parse location to extract city and state
  const parseLocation = (location: string): { city: string; state: string; zipcode: string } => {
    // Try to extract city, state, and zipcode from location string
    // Format examples: "Austin, TX" or "Austin, TX 78701" or "123 Main St, Austin, TX 78701"
    const parts = location.split(',').map(p => p.trim());
    let city = '';
    let state = '';
    let zipcode = '';

    if (parts.length >= 2) {
      const lastPart = parts[parts.length - 1];
      const secondLastPart = parts[parts.length - 2];

      // Try to extract zipcode from last part (e.g., "TX 78701")
      const zipcodeMatch = lastPart.match(/\b(\d{5})\b/);
      if (zipcodeMatch) {
        zipcode = zipcodeMatch[1];
      }

      // Check if last part looks like "TX" or "TX 78701"
      const stateMatch = lastPart.match(/\b([A-Z]{2})\b/);
      if (stateMatch) {
        city = secondLastPart;
        state = stateMatch[1];
      } else {
        city = secondLastPart;
        state = lastPart.substring(0, 2).toUpperCase();
      }
    }

    return { city, state, zipcode };
  };

  // Handle AI-discovered competitors
  const handleDiscoveryComplete = async (competitors: any[]) => {
    if (competitors.length === 0) {
      setError('Please select at least one competitor');
      return;
    }

    setLoading(true);
    setError('');
    setDiscoveredCompetitors(competitors);

    try {
      // Add all selected competitors
      for (const comp of competitors) {
        const res = await fetch('/api/onboarding/competitor', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: comp.name,
            url: comp.website,
          }),
        });

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || `Failed to add ${comp.name}`);
        }
      }

      // Move to next step
      setStep(3);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add competitors');
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

        {/* Step 2: Competitor Discovery (AI-Powered) */}
        {step === 2 && (
          <div>
            {/* Back Button */}
            <div className="mb-4">
              <button
                onClick={() => setStep(1)}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span>Back</span>
              </button>
            </div>

            {/* Discovery Component */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 md:p-8 shadow-sm">
              <CompetitorDiscovery
                onComplete={handleDiscoveryComplete}
                onSkip={() => router.push('/dashboard/competitors/new')}
                initialIndustry={businessData.industry}
                initialCity={parseLocation(businessData.location).city}
                initialState={parseLocation(businessData.location).state}
                initialZipcode={parseLocation(businessData.location).zipcode}
                maxSelectable={competitorLimit}
              />
            </div>

            {/* Error Display */}
            {error && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {/* Manual Entry Option */}
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600 mb-2">
                Prefer to add competitors manually?
              </p>
              <button
                onClick={() => router.push('/dashboard/competitors/new')}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Skip Discovery - Add Manually →
              </button>
            </div>
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
              Your dashboard is ready. {discoveredCompetitors.length > 0 ? (
                <>
                  We&apos;ll start monitoring <strong>{discoveredCompetitors.length} competitor{discoveredCompetitors.length !== 1 ? 's' : ''}</strong> every 12 hours for changes.
                </>
              ) : (
                <>
                  You can add competitors from your dashboard to start monitoring.
                </>
              )}
            </p>

            {discoveredCompetitors.length > 0 && (
              <div className="mb-6 text-left bg-gray-50 rounded-lg p-4">
                <p className="text-sm font-medium text-gray-900 mb-2">Monitoring:</p>
                <ul className="text-sm text-gray-600 space-y-1">
                  {discoveredCompetitors.slice(0, 5).map((comp, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <span className="text-green-600">✓</span>
                      <span>{comp.name}</span>
                    </li>
                  ))}
                  {discoveredCompetitors.length > 5 && (
                    <li className="text-gray-500 italic">
                      + {discoveredCompetitors.length - 5} more
                    </li>
                  )}
                </ul>
              </div>
            )}

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

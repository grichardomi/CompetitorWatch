'use client';

import { useRouter } from 'next/navigation';
import CompetitorDiscovery from '@/components/onboarding/CompetitorDiscovery';
import { useState, useEffect } from 'react';

export default function DiscoverCompetitorsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [addedCompetitors, setAddedCompetitors] = useState<any[]>([]);
  const [businessData, setBusinessData] = useState<any>(null);
  const [loadingBusiness, setLoadingBusiness] = useState(true);
  const [competitorLimit, setCompetitorLimit] = useState<number>(3);
  const [currentCount, setCurrentCount] = useState<number>(0);

  useEffect(() => {
    loadBusinessData();
  }, []);

  const loadBusinessData = async () => {
    try {
      const [businessRes, limitRes] = await Promise.all([
        fetch('/api/business'),
        fetch('/api/subscription/limit'),
      ]);

      if (businessRes.ok) {
        const businessData = await businessRes.json();
        setBusinessData(businessData.business);
      }

      if (limitRes.ok) {
        const limitData = await limitRes.json();
        setCompetitorLimit(limitData.competitorLimit || 3);
        setCurrentCount(limitData.currentCount || 0);
      }
    } catch (err) {
      console.error('Failed to load business data:', err);
    } finally {
      setLoadingBusiness(false);
    }
  };

  const parseLocation = (location: string): { city: string; state: string; zipcode: string } => {
    if (!location) return { city: '', state: '', zipcode: '' };

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

      // Extract state (2-letter code)
      const stateMatch = lastPart.match(/\b([A-Z]{2})\b/);
      if (stateMatch) {
        state = stateMatch[1];
        city = secondLastPart;
      } else {
        state = lastPart.substring(0, 2).toUpperCase();
        city = secondLastPart;
      }
    }

    return { city, state, zipcode };
  };

  const handleDiscoveryComplete = async (competitors: any[]) => {
    setLoading(true);
    setError('');
    const added: any[] = [];
    const failed: any[] = [];

    for (const comp of competitors) {
      try {
        const res = await fetch('/api/onboarding/competitor', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: comp.name,
            url: comp.website,
          }),
        });

        if (res.ok) {
          added.push(comp);
        } else {
          const errData = await res.json();

          // If limit reached, show error and stop
          if (res.status === 403) {
            setError(errData.error || 'Competitor limit reached');
            setLoading(false);
            if (added.length > 0) {
              setAddedCompetitors(added);
            }
            return;
          }

          failed.push({ ...comp, error: errData.error });
        }
      } catch (err) {
        failed.push({ ...comp, error: 'Network error' });
      }
    }

    setLoading(false);
    setAddedCompetitors(added);

    if (added.length > 0) {
      // Show success and redirect after 2 seconds
      setTimeout(() => {
        router.push('/dashboard/competitors');
        router.refresh();
      }, 2000);
    }
  };

  const handleSkip = () => {
    router.push('/dashboard/competitors/new');
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Discover Competitors
          </h1>
          <p className="text-gray-600">
            Use AI to automatically find and add competitors in your area
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 font-medium">{error}</p>
            {addedCompetitors.length > 0 && (
              <p className="text-red-600 text-sm mt-2">
                Successfully added {addedCompetitors.length} competitor(s) before reaching limit
              </p>
            )}
          </div>
        )}

        {addedCompetitors.length > 0 && !error && (
          <div className="mb-6 p-6 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-medium text-green-800">
                  Successfully added {addedCompetitors.length} competitor(s)!
                </h3>
                <ul className="mt-2 text-sm text-green-700">
                  {addedCompetitors.map((comp, idx) => (
                    <li key={idx}>✓ {comp.name}</li>
                  ))}
                </ul>
                <p className="mt-3 text-sm text-green-600">
                  Redirecting to competitors page...
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          {loadingBusiness ? (
            <div className="text-center py-8">
              <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">Loading your business info...</p>
            </div>
          ) : (
            <CompetitorDiscovery
              onComplete={handleDiscoveryComplete}
              onSkip={handleSkip}
              initialIndustry={businessData?.industry || ''}
              initialCity={businessData?.location ? parseLocation(businessData.location).city : ''}
              initialState={businessData?.location ? parseLocation(businessData.location).state : ''}
              initialZipcode={businessData?.location ? parseLocation(businessData.location).zipcode : ''}
              maxSelectable={Math.max(0, competitorLimit - currentCount)}
            />
          )}
        </div>

        {loading && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-sm">
              <div className="flex items-center space-x-3">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="text-gray-700">Adding competitors...</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

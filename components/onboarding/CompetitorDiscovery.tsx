'use client';

import { useState } from 'react';
import Link from 'next/link';

interface Competitor {
  name: string;
  website: string;
  relevanceScore: number;
  matchReason: string;
}

interface CompetitorDiscoveryProps {
  onComplete: (selectedCompetitors: Competitor[]) => void;
  onSkip: () => void;
  initialIndustry?: string;
  initialCity?: string;
  initialState?: string;
  initialZipcode?: string;
  maxSelectable?: number;
}

export default function CompetitorDiscovery({
  onComplete,
  onSkip,
  initialIndustry = '',
  initialCity = '',
  initialState = '',
  initialZipcode = '',
  maxSelectable = 999,
}: CompetitorDiscoveryProps) {
  // Form state
  const [industry, setIndustry] = useState(initialIndustry);
  const [customIndustry, setCustomIndustry] = useState('');
  const [city, setCity] = useState(initialCity);
  const [state, setState] = useState(initialState);
  const [zipcode, setZipcode] = useState(initialZipcode);

  // Discovery state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [showResults, setShowResults] = useState(false);

  const handleDiscover = async () => {
    setLoading(true);
    setError('');

    // Use custom industry if "Other" is selected
    const finalIndustry = industry === 'Other' ? customIndustry.trim() : industry;

    if (!finalIndustry) {
      setError('Please specify your industry');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/competitors/discover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          industry: finalIndustry,
          city,
          state,
          zipcode: zipcode || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to discover competitors');
      }

      if (data.count === 0) {
        setError(data.message || 'No competitors found. Try adjusting your search.');
        setCompetitors([]);
        setShowResults(false);
      } else {
        setCompetitors(data.competitors);
        setShowResults(true);

        // Auto-select top 2-3 competitors
        const autoSelect = new Set<number>();
        for (let i = 0; i < Math.min(3, data.competitors.length); i++) {
          autoSelect.add(i);
        }
        setSelected(autoSelect);
      }
    } catch (err: any) {
      console.error('Discovery error:', err);
      setError(err.message || 'Failed to discover competitors');
      setCompetitors([]);
      setShowResults(false);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSelect = (index: number) => {
    const newSelected = new Set(selected);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      // Check if we've reached the max
      if (newSelected.size >= maxSelectable) {
        setError(`You can only select up to ${maxSelectable} competitor${maxSelectable !== 1 ? 's' : ''}`);
        return;
      }
      newSelected.add(index);
      setError(''); // Clear error if successful
    }
    setSelected(newSelected);
  };

  const handleSelectAll = () => {
    if (selected.size === Math.min(competitors.length, maxSelectable)) {
      setSelected(new Set());
    } else {
      // Select up to maxSelectable
      const toSelect = competitors.slice(0, maxSelectable).map((_, i) => i);
      setSelected(new Set(toSelect));
      if (competitors.length > maxSelectable) {
        setError(`Limited to ${maxSelectable} competitor${maxSelectable !== 1 ? 's' : ''} based on your plan`);
      }
    }
  };

  const handleContinue = () => {
    const selectedCompetitors = Array.from(selected).map((i) => competitors[i]);
    onComplete(selectedCompetitors);
  };

  const handleBack = () => {
    setShowResults(false);
    setCompetitors([]);
    setSelected(new Set());
    setError('');
  };

  // Common industries
  const commonIndustries = [
    'Restaurant / Food Service',
    'Coffee Shop / Cafe',
    'Pizza Restaurant',
    'Fast Food',
    'Bar / Pub',
    'Bakery',
    'Hair Salon / Barber',
    'Nail Salon',
    'Spa / Wellness',
    'Gym / Fitness Center',
    'Yoga Studio',
    'Retail Store',
    'Clothing Boutique',
    'Bookstore',
    'Pet Store',
    'Hardware Store',
    'Auto Repair',
    'Car Wash',
    'Dental Office',
    'Medical Clinic',
    'Veterinary Clinic',
    'Real Estate Agency',
    'Law Firm',
    'Accounting Services',
    'Marketing Agency',
    'Consulting',
    'Other',
  ];

  // Common states (US)
  const states = [
    'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
    'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
    'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
    'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
    'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY',
  ];

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
          Find Your Competitors
        </h2>
        <p className="text-gray-600">
          We&apos;ll help you discover competitors in your area using AI
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* Input Form */}
      {!showResults && (
        <div className="bg-white rounded-lg border border-gray-200 p-6 md:p-8 mb-6">
          <div className="space-y-6">
            {/* Industry */}
            <div>
              <label htmlFor="industry" className="block text-sm font-medium text-gray-900 mb-2">
                Industry / Business Type *
              </label>
              <select
                id="industry"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-base"
              >
                <option value="">Select your industry</option>
                {commonIndustries.map((ind) => (
                  <option key={ind} value={ind}>
                    {ind}
                  </option>
                ))}
              </select>
              {industry === 'Other' && (
                <input
                  type="text"
                  value={customIndustry}
                  onChange={(e) => setCustomIndustry(e.target.value)}
                  placeholder="Enter your specific industry"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-base mt-3"
                />
              )}
              <p className="mt-1 text-sm text-gray-500">
                Select the category that best matches your business
              </p>
            </div>

            {/* Location Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="city" className="block text-sm font-medium text-gray-900 mb-2">
                  City *
                </label>
                <input
                  id="city"
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Austin"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-base"
                />
              </div>

              <div>
                <label htmlFor="state" className="block text-sm font-medium text-gray-900 mb-2">
                  State *
                </label>
                <select
                  id="state"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-base"
                >
                  <option value="">Select State</option>
                  {states.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Zipcode (Optional) */}
            <div>
              <label htmlFor="zipcode" className="block text-sm font-medium text-gray-900 mb-2">
                Zipcode (optional)
              </label>
              <input
                id="zipcode"
                type="text"
                value={zipcode}
                onChange={(e) => setZipcode(e.target.value)}
                placeholder="78701"
                maxLength={5}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-base"
              />
              <p className="mt-1 text-sm text-gray-500">
                For more precise results in your specific area
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-3 pt-4">
              <button
                onClick={handleDiscover}
                disabled={loading || !industry.trim() || !city.trim() || !state || (industry === 'Other' && !customIndustry.trim())}
                className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors inline-flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Discovering...</span>
                  </>
                ) : (
                  <>
                    <span>🔍</span>
                    <span>Find Competitors</span>
                  </>
                )}
              </button>

              <button
                onClick={onSkip}
                className="w-full px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
              >
                Skip - Add Manually
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Results */}
      {showResults && competitors.length > 0 && (
        <div className="space-y-6">
          {/* Results Header */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg font-semibold text-gray-900">
                  We found {competitors.length} competitors
                </p>
                <p className="text-sm text-gray-600">
                  Select the ones you want to monitor
                </p>
              </div>
              <button
                onClick={handleSelectAll}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                {selected.size === competitors.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>
          </div>

          {/* Competitor Cards */}
          <div className="space-y-3">
            {competitors.map((comp, index) => (
              <div
                key={index}
                onClick={() => handleToggleSelect(index)}
                className={`bg-white border rounded-lg p-4 md:p-5 cursor-pointer transition-all ${
                  selected.has(index)
                    ? 'bg-blue-50 border-blue-300 ring-2 ring-blue-200'
                    : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* Checkbox */}
                  <input
                    type="checkbox"
                    checked={selected.has(index)}
                    onChange={() => {}}
                    className="w-5 h-5 mt-1 text-blue-600 rounded focus:ring-blue-500"
                  />

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {comp.name}
                      </h3>
                      <span className="flex-shrink-0 px-3 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                        {comp.relevanceScore}% match
                      </span>
                    </div>

                    <Link
                      href={comp.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-sm text-blue-600 hover:underline mb-2 inline-block"
                    >
                      {comp.website}
                    </Link>

                    <p className="text-sm text-gray-600 mt-2">
                      {comp.matchReason}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Manual Add Option */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
            <p className="text-sm text-gray-600 mb-2">
              Don&apos;t see a competitor you want to monitor?
            </p>
            <button
              onClick={onSkip}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              + Add Competitor Manually
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={handleBack}
              className="sm:w-auto px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
            >
              ← Back
            </button>

            <button
              onClick={handleContinue}
              disabled={selected.size === 0}
              className="flex-1 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
            >
              Continue with {selected.size} competitor{selected.size !== 1 ? 's' : ''} →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

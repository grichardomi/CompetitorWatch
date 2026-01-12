'use client';

import { useState } from 'react';
import CompetitorDiscovery from '@/components/onboarding/CompetitorDiscovery';

/**
 * Test page for Competitor Discovery UI
 * Access at: http://localhost:3000/test-ui-discovery
 *
 * ⚠️ REMOVE THIS FILE BEFORE PRODUCTION DEPLOYMENT
 */
export default function TestUIDiscoveryPage() {
  const [selectedCompetitors, setSelectedCompetitors] = useState<any[]>([]);
  const [showResults, setShowResults] = useState(false);

  const handleComplete = (competitors: any[]) => {
    console.log('✅ Discovery completed!', competitors);
    setSelectedCompetitors(competitors);
    setShowResults(true);
  };

  const handleSkip = () => {
    console.log('⏭️ User skipped discovery');
    alert('Skip clicked - would normally navigate to manual entry');
  };

  const handleReset = () => {
    setSelectedCompetitors([]);
    setShowResults(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                🧪 Competitor Discovery UI Test
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Testing the competitor auto-discovery component
              </p>
            </div>
            {showResults && (
              <button
                onClick={handleReset}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Reset Test
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {!showResults ? (
          <>
            {/* Instructions */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
              <h2 className="text-lg font-semibold text-blue-900 mb-2">
                📋 Test Instructions
              </h2>
              <ul className="text-sm text-blue-800 space-y-2">
                <li>• Fill in the form below to test competitor discovery</li>
                <li>• Try: Industry = &quot;Pizza Restaurant&quot;, City = &quot;Austin&quot;, State = &quot;TX&quot;</li>
                <li>• Click &quot;Find Competitors&quot; to see the AI-powered results</li>
                <li>• Select competitors and click &quot;Continue&quot; to see the selection</li>
                <li>• Check browser console for detailed logs</li>
              </ul>
            </div>

            {/* Discovery Component */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
              <CompetitorDiscovery
                onComplete={handleComplete}
                onSkip={handleSkip}
                initialIndustry=""
                initialCity=""
                initialState=""
              />
            </div>
          </>
        ) : (
          /* Results Display */
          <div className="space-y-6">
            {/* Success Message */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <div className="flex items-start gap-4">
                <div className="text-4xl">✅</div>
                <div>
                  <h2 className="text-xl font-bold text-green-900 mb-2">
                    Discovery Test Successful!
                  </h2>
                  <p className="text-green-800">
                    User selected {selectedCompetitors.length} competitor{selectedCompetitors.length !== 1 ? 's' : ''}.
                    Check the results below.
                  </p>
                </div>
              </div>
            </div>

            {/* Selected Competitors */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                Selected Competitors ({selectedCompetitors.length})
              </h3>

              <div className="space-y-4">
                {selectedCompetitors.map((comp, index) => (
                  <div
                    key={index}
                    className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="text-lg font-semibold text-gray-900">
                            {index + 1}. {comp.name}
                          </h4>
                          <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                            {comp.relevanceScore}% match
                          </span>
                        </div>

                        <a
                          href={comp.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:underline mb-2 inline-block"
                        >
                          {comp.website} ↗
                        </a>

                        <p className="text-sm text-gray-600 mt-2">
                          <strong>Match Reason:</strong> {comp.matchReason}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* JSON Output */}
            <div className="bg-gray-900 rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-bold text-white mb-4">
                📄 JSON Output
              </h3>
              <pre className="text-xs text-green-400 overflow-x-auto">
                {JSON.stringify(selectedCompetitors, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="bg-gray-800 text-white py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-sm">
            ⚠️ This is a test page. Remove before production deployment.
          </p>
          <p className="text-xs text-gray-400 mt-2">
            File: <code>/app/test-ui-discovery/page.tsx</code>
          </p>
        </div>
      </div>
    </div>
  );
}

'use client';

import { INDUSTRY_METADATA, type Industry } from '@/lib/config/industries';

interface IndustryBadgeProps {
  industry: string;
  detectedIndustry?: string | null;
  industryConfidence?: number | null;
  businessIndustry?: string;
  showDetails?: boolean;
}

export function IndustryBadge({
  industry,
  industryConfidence,
  businessIndustry,
  showDetails = false,
}: IndustryBadgeProps) {
  const industryData = INDUSTRY_METADATA[industry as Industry];
  const matchesBusiness = businessIndustry && industry === businessIndustry;
  const confidence = industryConfidence ? parseFloat(industryConfidence.toString()) : null;

  if (!industryData) {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
        Unknown Industry
      </span>
    );
  }

  // Color based on match with business
  const badgeColor = matchesBusiness
    ? 'bg-green-100 text-green-800 border-green-200'
    : 'bg-yellow-100 text-yellow-800 border-yellow-200';

  return (
    <div className="inline-flex flex-col gap-1">
      <div className="inline-flex items-center gap-2">
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${badgeColor}`}
        >
          {industryData.label}
          {matchesBusiness && (
            <svg
              className="ml-1 h-3 w-3"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
          )}
        </span>

        {showDetails && confidence !== null && (
          <span className="text-xs text-gray-500">
            {Math.round(confidence * 100)}% confidence
          </span>
        )}
      </div>

      {showDetails && !matchesBusiness && businessIndustry && (
        <div className="text-xs text-yellow-700 bg-yellow-50 px-2 py-1 rounded border border-yellow-200">
          <div className="flex items-start gap-1">
            <svg
              className="h-4 w-4 flex-shrink-0 mt-0.5"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            <span>
              Different from your business (
              {INDUSTRY_METADATA[businessIndustry as Industry]?.label || businessIndustry})
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

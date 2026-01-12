'use client';

import dynamic from 'next/dynamic';

const AnalyticsPageClient = dynamic(() => import('./AnalyticsClient'), { ssr: false });

export default function AnalyticsPage() {
  return <AnalyticsPageClient />;
}

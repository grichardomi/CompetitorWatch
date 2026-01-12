'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { DYNAMIC_QUERY_CONFIG } from '@/lib/config/query-config';

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Default to DYNAMIC_QUERY_CONFIG for general use
            // Individual hooks can override with more specific configs
            ...DYNAMIC_QUERY_CONFIG,

            // Keep unused data in cache for 5 minutes
            gcTime: 5 * 60 * 1000,

            // Retry failed requests 1 time
            retry: 1,

            // Continue polling even when window not focused
            refetchIntervalInBackground: false, // Set true for critical data
          },
        },
      })
  );

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

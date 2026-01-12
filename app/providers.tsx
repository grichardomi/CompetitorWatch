'use client';

import { SessionProvider } from 'next-auth/react';
import { ReactNode } from 'react';
import { QueryProvider } from '@/lib/providers/QueryProvider';
import { NavigationProvider } from '@/lib/providers/NavigationProvider';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <QueryProvider>
        <NavigationProvider>
          {children}
        </NavigationProvider>
      </QueryProvider>
    </SessionProvider>
  );
}

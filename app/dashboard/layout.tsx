'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Header from '@/components/Header';
import { SubscriptionProvider, useSubscription } from '@/lib/providers/SubscriptionProvider';

function DashboardContent({ children }: { children: React.ReactNode }) {
  const { subscription } = useSubscription();

  return (
    <div className="min-h-screen bg-gray-50">
      <Header subscription={subscription} />
      {children}
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return null;
  }

  return (
    <SubscriptionProvider>
      <DashboardContent>{children}</DashboardContent>
    </SubscriptionProvider>
  );
}

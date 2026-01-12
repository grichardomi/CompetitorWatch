'use client';

import Header from './Header';

interface Subscription {
  status: string;
  daysRemaining: number | null;
  currentPeriodEnd: string;
}

interface DashboardLayoutProps {
  children: React.ReactNode;
  subscription?: Subscription | null;
}

export default function DashboardLayout({ children, subscription }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header subscription={subscription} />

      {/* Main content with bottom padding for mobile nav */}
      <main className="pb-20 md:pb-0">
        {children}
      </main>
    </div>
  );
}

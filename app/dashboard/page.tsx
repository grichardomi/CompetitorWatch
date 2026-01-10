'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [checkingStatus, setCheckingStatus] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    } else if (status === 'authenticated') {
      // Check if onboarding is complete
      checkOnboardingStatus();
    }
  }, [status, router]);

  const checkOnboardingStatus = async () => {
    try {
      const res = await fetch('/api/onboarding/status');
      const data = await res.json();

      if (!data.completed) {
        // User hasn't completed onboarding, redirect to onboarding
        router.push('/onboarding');
      } else {
        setCheckingStatus(false);
      }
    } catch (err) {
      console.error('Failed to check onboarding status:', err);
      setCheckingStatus(false);
    }
  };

  if (status === 'loading' || checkingStatus) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="container mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-2xl font-bold text-blue-600">
              CompetitorWatch
            </Link>

            {/* Desktop Menu */}
            <nav className="hidden md:flex items-center gap-8 flex-1 mx-8">
              <Link href="/dashboard" className="text-gray-600 hover:text-gray-900 font-medium">
                Dashboard
              </Link>
              <Link href="/dashboard/competitors" className="text-gray-600 hover:text-gray-900 font-medium">
                Competitors
              </Link>
              <Link href="/dashboard/alerts" className="text-gray-600 hover:text-gray-900 font-medium">
                Alerts
              </Link>
              <Link href="/dashboard/settings" className="text-gray-600 hover:text-gray-900 font-medium">
                Settings
              </Link>
            </nav>

            {/* User Menu */}
            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-gray-900">{session.user?.name || session.user?.email}</p>
                <p className="text-xs text-gray-600">On Trial</p>
              </div>
              <button
                onClick={() => signOut({ callbackUrl: '/' })}
                className="px-4 py-2 bg-gray-100 text-gray-900 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 sm:px-6 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Welcome to your dashboard</h1>
          <p className="text-gray-600">
            You&apos;re on a free 14-day trial. Start monitoring competitors to get real-time alerts.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {[
            { label: 'Active Competitors', value: '0', color: 'bg-blue-50', icon: '📊' },
            { label: 'Recent Alerts', value: '0', color: 'bg-green-50', icon: '🔔' },
            { label: 'Price Changes', value: '0', color: 'bg-purple-50', icon: '💰' },
          ].map((stat, idx) => (
            <div key={idx} className={`${stat.color} rounded-lg p-6 border border-gray-200`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">{stat.label}</p>
                  <p className="text-4xl font-bold mt-2">{stat.value}</p>
                </div>
                <span className="text-4xl" role="img">{stat.icon}</span>
              </div>
            </div>
          ))}
        </div>

        {/* CTA Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Add Competitors */}
          <div className="bg-white rounded-lg border border-gray-200 p-8">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <span className="text-2xl">👥</span>
            </div>
            <h3 className="text-lg font-semibold mb-2">Add Competitors</h3>
            <p className="text-gray-600 mb-4">
              Start monitoring your competitors&apos; websites for pricing changes and promotions.
            </p>
            <Link
              href="/dashboard/competitors"
              className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Add Competitor
            </Link>
          </div>

          {/* View Settings */}
          <div className="bg-white rounded-lg border border-gray-200 p-8">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
              <span className="text-2xl">⚙️</span>
            </div>
            <h3 className="text-lg font-semibold mb-2">Notification Settings</h3>
            <p className="text-gray-600 mb-4">
              Configure how and when you receive alerts about competitor changes.
            </p>
            <Link
              href="/dashboard/settings"
              className="inline-block px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
            >
              View Settings
            </Link>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg border border-gray-200 p-8">
          <h2 className="text-xl font-bold mb-6">Recent Activity</h2>
          <div className="text-center py-12">
            <p className="text-gray-600">No activity yet. Add a competitor to get started!</p>
          </div>
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 md:hidden safe-bottom z-40">
        <div className="flex justify-around">
          {[
            { label: 'Dashboard', href: '/dashboard', icon: '📊' },
            { label: 'Competitors', href: '/dashboard/competitors', icon: '👥' },
            { label: 'Alerts', href: '/dashboard/alerts', icon: '🔔' },
            { label: 'Settings', href: '/dashboard/settings', icon: '⚙️' },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center py-3 px-4 text-xs font-medium text-gray-600 hover:text-blue-600"
            >
              <span className="text-lg mb-1">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}

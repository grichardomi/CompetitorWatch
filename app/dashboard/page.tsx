'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSubscription } from '@/lib/providers/SubscriptionProvider';

interface DashboardStats {
  competitorsCount: number;
  alertsCount: number;
  priceChangesCount: number;
}

interface ActivityItem {
  id: number;
  type: 'alert' | 'competitor_added' | 'price_change';
  title: string;
  description: string;
  createdAt: string;
  competitorName?: string;
}

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { subscription } = useSubscription();
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    competitorsCount: 0,
    alertsCount: 0,
    priceChangesCount: 0,
  });
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);
  const [activityLimit, setActivityLimit] = useState(5);
  const [hasMoreActivity, setHasMoreActivity] = useState(false);

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
        // Fetch dashboard stats
        fetchDashboardStats();
      }
    } catch (err) {
      console.error('Failed to check onboarding status:', err);
      setCheckingStatus(false);
    }
  };

  const fetchDashboardStats = async () => {
    try {
      // Fetch competitors
      const competitorsRes = await fetch('/api/competitors');
      const competitorsData = await competitorsRes.json();

      // Fetch alerts
      const alertsRes = await fetch('/api/alerts?isRead=false');
      const alertsData = await alertsRes.json();

      // Count price changes from alerts
      const priceChanges = alertsData.alerts?.filter(
        (alert: any) => alert.alertType === 'price_change'
      ).length || 0;

      setStats({
        competitorsCount: competitorsData.currentCount || 0,
        alertsCount: alertsData.total || 0,
        priceChangesCount: priceChanges,
      });

      // Fetch recent activity
      await fetchRecentActivity();
    } catch (err) {
      console.error('Failed to fetch dashboard stats:', err);
    }
  };

  const fetchRecentActivity = async () => {
    try {
      const res = await fetch(`/api/alerts?limit=${activityLimit + 1}`);
      const data = await res.json();

      if (data.alerts) {
        const activity: ActivityItem[] = data.alerts.slice(0, activityLimit).map((alert: any) => ({
          id: alert.id,
          type: alert.alertType === 'price_change' ? 'price_change' : 'alert',
          title: alert.alertType === 'price_change' ? 'Price Change Detected' : 'New Alert',
          description: alert.message,
          createdAt: alert.createdAt,
          competitorName: alert.competitor?.name,
        }));

        setRecentActivity(activity);
        setHasMoreActivity(data.alerts.length > activityLimit);
      }
    } catch (err) {
      console.error('Failed to fetch recent activity:', err);
    }
  };

  const loadMoreActivity = () => {
    setActivityLimit(prev => prev + 5);
  };

  useEffect(() => {
    if (recentActivity.length > 0) {
      fetchRecentActivity();
    }
  }, [activityLimit]);

  if (status === 'loading' || checkingStatus) {
    return (
      <div className="flex items-center justify-center py-20">
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
    <main className="container mx-auto px-4 sm:px-6 py-8 pb-20 md:pb-8">
        {/* Trial Expiration Banner */}
        {subscription?.status === 'trialing' && subscription?.daysRemaining !== null && subscription.daysRemaining <= 7 && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-yellow-900 font-medium">
              ⏰ Your trial ends in {subscription.daysRemaining} {subscription.daysRemaining === 1 ? 'day' : 'days'}.{' '}
              <Link href="/dashboard/billing" className="underline hover:text-yellow-800">
                Upgrade now
              </Link>{' '}
              to continue monitoring your competitors.
            </p>
          </div>
        )}

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
            { label: 'Active Competitors', value: stats.competitorsCount.toString(), color: 'bg-blue-50', icon: '📊' },
            { label: 'Unread Alerts', value: stats.alertsCount.toString(), color: 'bg-green-50', icon: '🔔' },
            { label: 'Price Changes', value: stats.priceChangesCount.toString(), color: 'bg-purple-50', icon: '💰' },
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* Add Competitors */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <span className="text-2xl">👥</span>
            </div>
            <h3 className="text-lg font-semibold mb-2">Add Competitors</h3>
            <p className="text-gray-600 text-sm mb-4">
              Start monitoring your competitors&apos; websites for pricing changes and promotions.
            </p>
            <Link
              href="/dashboard/competitors"
              className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
            >
              Add Competitor
            </Link>
          </div>

          {/* Profile Settings */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              <span className="text-2xl">👤</span>
            </div>
            <h3 className="text-lg font-semibold mb-2">Profile Settings</h3>
            <p className="text-gray-600 text-sm mb-4">
              Manage your account information, email, and authentication methods.
            </p>
            <Link
              href="/dashboard/profile"
              className="inline-block px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-sm"
            >
              Manage Profile
            </Link>
          </div>

          {/* Business Settings */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
              <span className="text-2xl">🏢</span>
            </div>
            <h3 className="text-lg font-semibold mb-2">Business Settings</h3>
            <p className="text-gray-600 text-sm mb-4">
              Update your business name, location, and view your industry settings.
            </p>
            <Link
              href="/dashboard/business"
              className="inline-block px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium text-sm"
            >
              Edit Business
            </Link>
          </div>

          {/* Security Settings */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4">
              <span className="text-2xl">🔒</span>
            </div>
            <h3 className="text-lg font-semibold mb-2">Security</h3>
            <p className="text-gray-600 text-sm mb-4">
              Change your password and manage account security settings.
            </p>
            <Link
              href="/dashboard/security"
              className="inline-block px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium text-sm"
            >
              Security Settings
            </Link>
          </div>

          {/* Notification Settings */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
              <span className="text-2xl">⚙️</span>
            </div>
            <h3 className="text-lg font-semibold mb-2">Notifications</h3>
            <p className="text-gray-600 text-sm mb-4">
              Configure how and when you receive alerts about competitor changes.
            </p>
            <Link
              href="/dashboard/settings"
              className="inline-block px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium text-sm"
            >
              View Settings
            </Link>
          </div>

          {/* Billing */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
              <span className="text-2xl">💳</span>
            </div>
            <h3 className="text-lg font-semibold mb-2">Billing</h3>
            <p className="text-gray-600 text-sm mb-4">
              Manage your subscription, payment methods, and billing history.
            </p>
            <Link
              href="/dashboard/billing"
              className="inline-block px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium text-sm"
            >
              Manage Billing
            </Link>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 sm:p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold">Recent Activity</h2>
            {recentActivity.length > 0 && (
              <Link
                href="/dashboard/alerts"
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                View All →
              </Link>
            )}
          </div>

          {recentActivity.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600">No activity yet. Add a competitor to get started!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentActivity.map((item) => (
                <div
                  key={item.id}
                  className="flex items-start gap-3 p-4 rounded-lg hover:bg-gray-50 transition-colors border border-gray-100"
                >
                  {/* Icon */}
                  <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                    item.type === 'price_change'
                      ? 'bg-purple-100 text-purple-600'
                      : 'bg-blue-100 text-blue-600'
                  }`}>
                    {item.type === 'price_change' ? '💰' : '🔔'}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 text-sm">{item.title}</p>
                        {item.competitorName && (
                          <p className="text-xs text-gray-500 mt-0.5">{item.competitorName}</p>
                        )}
                      </div>
                      <span className="text-xs text-gray-500 whitespace-nowrap">
                        {new Date(item.createdAt).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">{item.description}</p>
                  </div>
                </div>
              ))}

              {/* Load More Button */}
              {hasMoreActivity && (
                <div className="pt-2">
                  <button
                    onClick={loadMoreActivity}
                    className="w-full px-4 py-3 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors border border-blue-200 hover:border-blue-300"
                  >
                    Load More Activity
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
  );
}

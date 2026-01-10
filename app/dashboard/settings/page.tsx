'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';

interface NotificationPreferences {
  id: number;
  userId: number;
  emailEnabled: boolean;
  emailFrequency: string;
  smsEnabled: boolean;
  smsPhoneNumber: string | null;
  smsVerified: boolean;
  alertTypes: string[];
  quietHoursStart: string | null;
  quietHoursEnd: string | null;
  timezone: string;
  createdAt: string;
  updatedAt: string;
}

const TIMEZONES = [
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Anchorage',
  'Pacific/Honolulu',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Asia/Tokyo',
  'Asia/Shanghai',
  'Asia/Hong_Kong',
  'Asia/Singapore',
  'Australia/Sydney',
  'Australia/Melbourne',
];

const ALERT_TYPES = [
  { id: 'price_change', label: 'Price Changes', description: 'Get notified when competitor prices change' },
  { id: 'new_promotion', label: 'New Promotions', description: 'Get notified about new promotions and deals' },
  { id: 'menu_change', label: 'Menu Changes', description: 'Get notified when menus or offerings change' },
];

export default function SettingsPage() {
  const { status } = useSession();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  // Form state
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [emailFrequency, setEmailFrequency] = useState('instant');
  const [smsEnabled, setSmsEnabled] = useState(false);
  const [smsPhoneNumber, setSmsPhoneNumber] = useState('');
  const [selectedAlertTypes, setSelectedAlertTypes] = useState<string[]>([]);
  const [quietHoursStart, setQuietHoursStart] = useState('');
  const [quietHoursEnd, setQuietHoursEnd] = useState('');
  const [timezone, setTimezone] = useState('America/New_York');
  const [verificationCode, setVerificationCode] = useState('');
  const [showVerification, setShowVerification] = useState(false);

  // Redirect if not authenticated
  if (status === 'unauthenticated') {
    router.push('/auth/signin');
  }

  // Load preferences
  useEffect(() => {
    if (status === 'authenticated') {
      loadPreferences();
    }
  }, [status]);

  const loadPreferences = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/settings/notifications');
      if (!res.ok) throw new Error('Failed to load preferences');

      const data: NotificationPreferences = await res.json();
      setPreferences(data);

      // Update form state
      setEmailEnabled(data.emailEnabled);
      setEmailFrequency(data.emailFrequency);
      setSmsEnabled(data.smsEnabled);
      setSmsPhoneNumber(data.smsPhoneNumber || '');
      setSelectedAlertTypes(Array.isArray(data.alertTypes) ? data.alertTypes : []);
      setQuietHoursStart(data.quietHoursStart || '');
      setQuietHoursEnd(data.quietHoursEnd || '');
      setTimezone(data.timezone);
      setError('');
    } catch (err) {
      console.error('Failed to load preferences:', err);
      setError('Failed to load notification preferences');
    } finally {
      setLoading(false);
    }
  };

  const handleAlertTypeToggle = (type: string) => {
    setSelectedAlertTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
    setHasChanges(true);
  };

  const handleSavePreferences = async () => {
    try {
      setSaving(true);
      setError('');
      setSuccess('');

      const res = await fetch('/api/settings/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emailEnabled,
          emailFrequency,
          smsEnabled,
          smsPhoneNumber: smsPhoneNumber || null,
          alertTypes: selectedAlertTypes,
          quietHoursStart: quietHoursStart ? `2000-01-01T${quietHoursStart}:00` : null,
          quietHoursEnd: quietHoursEnd ? `2000-01-01T${quietHoursEnd}:00` : null,
          timezone,
        }),
      });

      if (!res.ok) throw new Error('Failed to save preferences');

      const updated = await res.json();
      setPreferences(updated);
      setHasChanges(false);
      setSuccess('Notification preferences updated successfully!');

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Failed to save preferences:', err);
      setError(err instanceof Error ? err.message : 'Failed to save preferences');
    } finally {
      setSaving(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-0">
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
              <Link
                href="/dashboard/competitors"
                className="text-gray-600 hover:text-gray-900 font-medium"
              >
                Competitors
              </Link>
              <Link href="/dashboard/alerts" className="text-gray-600 hover:text-gray-900 font-medium">
                Alerts
              </Link>
              <Link
                href="/dashboard/settings"
                className="text-blue-600 font-medium border-b-2 border-blue-600"
              >
                Settings
              </Link>
            </nav>

            {/* Title on mobile */}
            <div className="md:hidden">
              <h1 className="text-lg font-bold">Settings</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 sm:px-6 py-8 max-w-4xl">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
            ✓ {success}
          </div>
        )}

        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Settings</h1>
          <p className="text-gray-600">Manage your notification preferences and alert settings</p>
        </div>

        {/* Notification Settings */}
        <div className="space-y-8">
          {/* Email Notifications Section */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Email Notifications</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Receive alerts via email when your competitors have changes
                </p>
              </div>
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={emailEnabled}
                  onChange={(e) => {
                    setEmailEnabled(e.target.checked);
                    setHasChanges(true);
                  }}
                  className="w-5 h-5 text-blue-600 rounded"
                />
              </label>
            </div>

            {emailEnabled && (
              <div className="space-y-6 pt-6 border-t border-gray-200">
                {/* Email Frequency */}
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-3">
                    Email Frequency
                  </label>
                  <div className="space-y-3">
                    {[
                      { value: 'instant', label: 'Instant', description: 'Get notified immediately' },
                      { value: 'hourly', label: 'Hourly', description: 'Get one email per hour' },
                      { value: 'daily', label: 'Daily', description: 'Get one email per day' },
                      { value: 'weekly', label: 'Weekly', description: 'Get one email per week' },
                    ].map((option) => (
                      <label
                        key={option.value}
                        className="flex items-start p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50"
                      >
                        <input
                          type="radio"
                          name="frequency"
                          value={option.value}
                          checked={emailFrequency === option.value}
                          onChange={(e) => {
                            setEmailFrequency(e.target.value);
                            setHasChanges(true);
                          }}
                          className="w-4 h-4 text-blue-600 mt-1"
                        />
                        <div className="ml-3 flex-1">
                          <p className="font-medium text-gray-900">{option.label}</p>
                          <p className="text-sm text-gray-600">{option.description}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Quiet Hours */}
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-3">
                    Quiet Hours (Optional)
                  </label>
                  <p className="text-sm text-gray-600 mb-3">
                    Don't send notifications between these hours
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-2">From</label>
                      <input
                        type="time"
                        value={quietHoursStart}
                        onChange={(e) => {
                          setQuietHoursStart(e.target.value);
                          setHasChanges(true);
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-2">To</label>
                      <input
                        type="time"
                        value={quietHoursEnd}
                        onChange={(e) => {
                          setQuietHoursEnd(e.target.value);
                          setHasChanges(true);
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Timezone */}
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">Timezone</label>
                  <select
                    value={timezone}
                    onChange={(e) => {
                      setTimezone(e.target.value);
                      setHasChanges(true);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    {TIMEZONES.map((tz) => (
                      <option key={tz} value={tz}>
                        {tz}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* SMS Notifications Section */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900">SMS Notifications</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Receive instant alerts via text message
                </p>
              </div>
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={smsEnabled}
                  onChange={(e) => {
                    setSmsEnabled(e.target.checked);
                    if (e.target.checked) {
                      setShowVerification(true);
                    }
                    setHasChanges(true);
                  }}
                  className="w-5 h-5 text-blue-600 rounded"
                />
              </label>
            </div>

            {smsEnabled && (
              <div className="space-y-6 pt-6 border-t border-gray-200">
                {/* Phone Number */}
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={smsPhoneNumber}
                    onChange={(e) => {
                      setSmsPhoneNumber(e.target.value);
                      setHasChanges(true);
                    }}
                    placeholder="+1 (555) 000-0000"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                  <p className="text-xs text-gray-600 mt-1">
                    {preferences?.smsVerified ? (
                      <span className="text-green-600">✓ Phone number verified</span>
                    ) : (
                      <span>Please verify your phone number to enable SMS notifications</span>
                    )}
                  </p>
                </div>

                {/* Verification Code */}
                {showVerification && !preferences?.smsVerified && (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-900 mb-3">
                      We'll send a verification code to your phone number. Enter it here to verify:
                    </p>
                    <input
                      type="text"
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value)}
                      placeholder="000000"
                      maxLength={6}
                      className="w-24 px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-center"
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Alert Types Section */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Alert Types</h2>
            <p className="text-sm text-gray-600 mb-6">
              Choose which types of alerts you want to receive notifications for
            </p>

            <div className="space-y-3">
              {ALERT_TYPES.map((type) => (
                <label
                  key={type.id}
                  className="flex items-start p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50"
                >
                  <input
                    type="checkbox"
                    checked={selectedAlertTypes.includes(type.id)}
                    onChange={() => handleAlertTypeToggle(type.id)}
                    className="w-5 h-5 text-blue-600 rounded mt-0.5"
                  />
                  <div className="ml-3 flex-1">
                    <p className="font-medium text-gray-900">{type.label}</p>
                    <p className="text-sm text-gray-600">{type.description}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Save Button */}
          <div className="flex gap-3">
            <button
              onClick={() => loadPreferences()}
              disabled={saving || !hasChanges}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Discard Changes
            </button>
            <button
              onClick={handleSavePreferences}
              disabled={saving || !hasChanges}
              className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : 'Save Preferences'}
            </button>
          </div>

          {/* Additional Information */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="font-semibold text-blue-900 mb-3">💡 Tips</h3>
            <ul className="text-sm text-blue-800 space-y-2">
              <li>• Use quiet hours to avoid notifications during sleep or focus time</li>
              <li>• Set your timezone correctly to ensure alerts arrive at the right time</li>
              <li>• Select at least one alert type to receive notifications</li>
              <li>• SMS notifications require phone verification for security</li>
            </ul>
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
              className={`flex flex-col items-center py-3 px-4 text-xs font-medium ${
                item.href === '/dashboard/settings'
                  ? 'text-blue-600'
                  : 'text-gray-600 hover:text-blue-600'
              }`}
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

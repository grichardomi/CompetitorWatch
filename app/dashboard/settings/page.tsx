'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePushNotifications } from '@/lib/hooks/usePushNotifications';

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

  // Push notifications
  const {
    isSupported: pushSupported,
    isSubscribed: pushEnabled,
    isLoading: pushLoading,
    error: pushError,
    subscribe: enablePush,
    unsubscribe: disablePush,
  } = usePushNotifications();

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

  const handleTestPushNotification = async () => {
    try {
      setError('');
      setSuccess('');

      const res = await fetch('/api/push/test', {
        method: 'POST',
      });

      if (!res.ok) throw new Error('Failed to send test notification');

      const data = await res.json();
      if (data.sent > 0) {
        setSuccess(`Test notification sent to ${data.sent} device(s)!`);
      } else {
        setError('No subscriptions found. Enable push notifications first.');
      }

      // Clear message after 3 seconds
      setTimeout(() => {
        setSuccess('');
        setError('');
      }, 3000);
    } catch (err) {
      console.error('Failed to send test notification:', err);
      setError(err instanceof Error ? err.message : 'Failed to send test notification');
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
      <main className="container mx-auto px-4 sm:px-6 py-8 max-w-4xl pb-20 md:pb-8">
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
                    Don&apos;t send notifications between these hours
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

          {/* Push Notifications Section */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Push Notifications</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Receive instant browser notifications on this device
                </p>
              </div>
              {pushSupported ? (
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={pushEnabled}
                    disabled={pushLoading}
                    onChange={async (e) => {
                      if (e.target.checked) {
                        await enablePush();
                      } else {
                        await disablePush();
                      }
                    }}
                    className="w-5 h-5 text-blue-600 rounded disabled:opacity-50"
                  />
                </label>
              ) : (
                <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded">Not Supported</span>
              )}
            </div>

            {!pushSupported && (
              <div className="pt-6 border-t border-gray-200">
                <p className="text-sm text-gray-600">
                  Push notifications are not supported in your current browser. Try using Chrome, Firefox, Edge, or Safari on desktop or mobile.
                </p>
              </div>
            )}

            {pushSupported && pushEnabled && (
              <div className="pt-6 border-t border-gray-200">
                <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <svg className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-green-900">Push notifications enabled</p>
                    <p className="text-sm text-green-700 mt-1">
                      You&apos;ll receive instant notifications on this device when alerts are triggered.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {pushSupported && !pushEnabled && !pushLoading && (
              <div className="pt-6 border-t border-gray-200">
                <p className="text-sm text-gray-600 mb-4">
                  Enable push notifications to receive instant alerts on this device. You&apos;ll be asked to grant permission.
                </p>
                <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <div className="text-sm">
                    <p className="font-medium text-blue-900">Benefits:</p>
                    <ul className="text-blue-800 mt-2 space-y-1">
                      <li>• Instant notifications even when the site is not open</li>
                      <li>• Free alternative to SMS notifications</li>
                      <li>• Works on desktop and mobile browsers</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {pushError && (
              <div className="pt-6 border-t border-gray-200">
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-800">
                    <span className="font-medium">Error:</span> {pushError}
                  </p>
                </div>
              </div>
            )}

            {pushLoading && (
              <div className="pt-6 border-t border-gray-200">
                <div className="flex items-center gap-3 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                  <div className="w-5 h-5 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
                  <p className="text-sm text-gray-700">Processing...</p>
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
                      We&apos;ll send a verification code to your phone number. Enter it here to verify:
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
              <li>• Push notifications are free and instant - enable them for best experience</li>
              <li>• SMS notifications require phone verification for security</li>
            </ul>
          </div>

          {/* Danger Zone */}
          <div className="bg-red-50 border-2 border-red-200 rounded-lg p-6">
            <div className="flex gap-3">
              <div className="flex-shrink-0">
                <svg
                  className="w-6 h-6 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-red-900 mb-2">Danger Zone</h3>
                <p className="text-sm text-red-800 mb-4">
                  Permanently delete your account and all associated data. This action cannot be undone.
                </p>
                <Link
                  href="/dashboard/account/delete"
                  className="inline-block px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium text-sm"
                >
                  Delete Account
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
  );
}

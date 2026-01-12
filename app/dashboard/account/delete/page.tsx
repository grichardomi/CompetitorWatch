'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';

interface UserProfile {
  hasPassword: boolean;
}

export default function DeleteAccountPage() {
  const { status } = useSession();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [confirmText, setConfirmText] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Redirect if not authenticated
  if (status === 'unauthenticated') {
    router.push('/auth/signin');
  }

  // Load profile
  useEffect(() => {
    if (status === 'authenticated') {
      loadProfile();
    }
  }, [status]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/user/profile');
      if (!res.ok) throw new Error('Failed to load profile');

      const data = await res.json();
      setProfile({
        hasPassword: data.hasPassword,
      });
      setError('');
    } catch (err) {
      console.error('Failed to load profile:', err);
      setError('Failed to load account information');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    setError('');

    // Validate confirm text
    if (confirmText !== 'DELETE') {
      setError('Please type DELETE to confirm');
      return;
    }

    // Validate password if user has one
    if (profile?.hasPassword && !password) {
      setError('Password is required to delete your account');
      return;
    }

    try {
      setDeleting(true);

      const res = await fetch('/api/account/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          confirmText,
          password: password || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to delete account');
      }

      // Sign out and redirect
      await signOut({ callbackUrl: '/auth/signin?deleted=true', redirect: true });
    } catch (err) {
      console.error('Failed to delete account:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete account');
      setDeleting(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <>
        <main className="container mx-auto px-4 sm:px-6 py-8 max-w-4xl pb-20 md:pb-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Page Title */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2 text-red-600">Delete Account</h1>
            <p className="text-gray-600">
              This action is permanent and cannot be undone
            </p>
          </div>

          <div className="space-y-8">
            {/* Warning Card */}
            <div className="bg-red-50 border-2 border-red-200 rounded-lg p-6">
              <div className="flex gap-3">
                <div className="flex-shrink-0">
                  <svg
                    className="w-8 h-8 text-red-600"
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
                <div>
                  <h3 className="font-bold text-red-900 text-lg mb-3">
                    Warning: This will permanently delete:
                  </h3>
                  <ul className="text-sm text-red-800 space-y-2 mb-4">
                    <li>• Your user account and profile information</li>
                    <li>• All businesses and competitor tracking data</li>
                    <li>• All alerts and notification history</li>
                    <li>• All price snapshots and historical data</li>
                    <li>• All subscription and payment records</li>
                    <li>• All webhook configurations and deliveries</li>
                    <li>• All notification preferences</li>
                  </ul>
                  <p className="text-sm font-semibold text-red-900">
                    This action cannot be reversed. All data will be permanently lost.
                  </p>
                </div>
              </div>
            </div>

            {/* Alternative Options */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Before you go...</h2>
              <p className="text-sm text-gray-600 mb-4">
                Consider these alternatives instead of deleting your account:
              </p>

              <div className="space-y-3">
                <Link
                  href="/dashboard/billing"
                  className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  <h3 className="font-medium text-gray-900 mb-1">Cancel Subscription</h3>
                  <p className="text-sm text-gray-600">
                    Stop recurring charges while keeping your data
                  </p>
                </Link>

                <Link
                  href="/dashboard/settings"
                  className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  <h3 className="font-medium text-gray-900 mb-1">Disable Notifications</h3>
                  <p className="text-sm text-gray-600">
                    Turn off all email and SMS alerts
                  </p>
                </Link>

                <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                  <h3 className="font-medium text-gray-900 mb-1">Contact Support</h3>
                  <p className="text-sm text-gray-600 mb-2">
                    Having issues? We&apos;re here to help
                  </p>
                  <a
                    href="mailto:support@marketpulse.com"
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    support@marketpulse.com
                  </a>
                </div>
              </div>
            </div>

            {/* Delete Button */}
            <div className="flex gap-3">
              <Link
                href="/dashboard/settings"
                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium text-center"
              >
                Cancel
              </Link>
              <button
                onClick={() => setShowModal(true)}
                className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
              >
                Delete My Account
              </button>
            </div>
          </div>
        </main>

      {/* Confirmation Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Final Confirmation</h2>

            <p className="text-sm text-gray-600 mb-6">
              To confirm deletion, please type <strong>DELETE</strong> in the box below
              {profile?.hasPassword && ' and enter your password'}.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type DELETE to confirm
                </label>
                <input
                  type="text"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:outline-none"
                  placeholder="DELETE"
                  disabled={deleting}
                />
              </div>

              {profile?.hasPassword && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Your Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:outline-none pr-10"
                      placeholder="Enter your password"
                      disabled={deleting}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      disabled={deleting}
                    >
                      {showPassword ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowModal(false);
                  setConfirmText('');
                  setPassword('');
                  setError('');
                }}
                disabled={deleting}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleting || confirmText !== 'DELETE'}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deleting ? 'Deleting...' : 'Delete Account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

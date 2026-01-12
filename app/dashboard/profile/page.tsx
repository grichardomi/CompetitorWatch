'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';

interface UserProfile {
  id: number;
  email: string;
  name: string | null;
  image: string | null;
  hasPassword: boolean;
  authMethods: string[];
  createdAt: string;
  role: string;
}

export default function ProfilePage() {
  const { status } = useSession();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

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

      const data: UserProfile = await res.json();
      setProfile(data);

      // Update form state
      setName(data.name || '');
      setEmail(data.email);
      setError('');
      setHasChanges(false);
    } catch (err) {
      console.error('Failed to load profile:', err);
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      setError('');
      setSuccess('');

      const res = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to update profile');
      }

      setProfile((prev) => (prev ? { ...prev, ...data.user } : null));
      setHasChanges(false);
      setSuccess('Profile updated successfully!');

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);

      // If email changed, sign out for security
      if (email !== profile?.email) {
        setTimeout(() => {
          signOut({ callbackUrl: '/auth/signin' });
        }, 2000);
      }
    } catch (err) {
      console.error('Failed to save profile:', err);
      setError(err instanceof Error ? err.message : 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
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
          <h1 className="text-3xl font-bold mb-2">Profile Settings</h1>
          <p className="text-gray-600">Manage your personal information and account settings</p>
        </div>

        <div className="space-y-8">
          {/* Personal Information */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Personal Information</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    setHasChanges(true);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="Your name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setHasChanges(true);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="your@email.com"
                />
                {email !== profile?.email && (
                  <p className="text-xs text-orange-600 mt-1">
                    ⚠️ Changing your email will require you to sign in again
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Account Information */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Account Information</h2>

            <div className="space-y-4 text-sm">
              <div className="flex justify-between py-2">
                <span className="text-gray-600">Account ID</span>
                <span className="font-medium">{profile?.id}</span>
              </div>

              <div className="flex justify-between py-2">
                <span className="text-gray-600">Account Created</span>
                <span className="font-medium">
                  {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : 'N/A'}
                </span>
              </div>

              <div className="flex justify-between py-2">
                <span className="text-gray-600">Role</span>
                <span className="font-medium capitalize">{profile?.role}</span>
              </div>

              <div className="flex justify-between py-2 border-t border-gray-200 pt-4">
                <span className="text-gray-600">Authentication Methods</span>
                <div className="flex gap-2">
                  {profile?.authMethods.map((method) => (
                    <span
                      key={method}
                      className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium"
                    >
                      {method === 'google' ? 'Google' : 'Password'}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Quick Links */}
            <div className="mt-6 pt-6 border-t border-gray-200 space-y-3">
              {!profile?.hasPassword && (
                <Link
                  href="/dashboard/security"
                  className="block px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg border border-blue-200 text-center font-medium"
                >
                  Set a Password
                </Link>
              )}
              <Link
                href="/dashboard/security"
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg border border-gray-200 text-center font-medium"
              >
                Manage Security Settings
              </Link>
              <Link
                href="/dashboard/business"
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg border border-gray-200 text-center font-medium"
              >
                Business Settings
              </Link>
            </div>
          </div>

          {/* Save Buttons */}
          <div className="flex gap-3">
            <button
              onClick={() => loadProfile()}
              disabled={saving || !hasChanges}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Discard Changes
            </button>
            <button
              onClick={handleSaveProfile}
              disabled={saving || !hasChanges}
              className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </main>
  );
}

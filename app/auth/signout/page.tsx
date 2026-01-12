'use client';

import { signOut } from 'next-auth/react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function SignOut() {
  const [isSigning, setIsSigning] = useState(false);

  useEffect(() => {
    const handleSignOut = async () => {
      setIsSigning(true);
      await signOut({ redirect: true, callbackUrl: '/' });
    };

    // Auto sign out after 2 seconds on mount
    const timer = setTimeout(handleSignOut, 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg border border-gray-200 p-8 shadow-sm text-center">
          <Link href="/" className="inline-block text-2xl font-bold text-blue-600 mb-6">
            MarketPulse
          </Link>

          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-spin">
            <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </div>

          <h1 className="text-2xl font-bold mb-3">Signing out...</h1>
          <p className="text-gray-600 mb-6">
            You&apos;re being signed out. Redirecting you to the home page.
          </p>

          {!isSigning && (
            <Link
              href="/"
              className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Go home
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

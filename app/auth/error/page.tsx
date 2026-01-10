'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

const errorMessages: { [key: string]: string } = {
  Callback: 'There was an error with the authentication provider. Please try again.',
  OAuthSignin: 'Unable to sign in with the selected provider. Please try again.',
  OAuthCallback: 'The authentication provider returned an error. Please try again.',
  EmailCreateAccount: 'Could not create account with that email. Please try again.',
  EmailSignin: 'Email sign in is not enabled. Please use another method.',
  EmailCallback: 'The email sign in link has expired or is invalid.',
  SessionCallback: 'Your session is invalid. Please sign in again.',
  SessionSignin: 'There was an error with your session. Please sign in again.',
  SessionCallback2: 'There was an error with your session. Please sign in again.',
  CredentialsSignin: 'Invalid email or password. Please try again.',
  OAuthAccountNotLinked: 'To confirm your identity, sign in with the same account you used originally.',
  EmailAccountNotLinked: 'To confirm your identity, use the email you signed up with.',
  Signin: 'Check your email for a sign in link.',
  OAuthCreateAccount: 'Could not create account using that provider. Please try again.',
  SessionSignin2: 'There was an error with your session. Please sign in again.',
  Unknown: 'An unexpected error occurred. Please try again.',
};

function AuthErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error') || 'Unknown';
  const message = errorMessages[error] || errorMessages['Unknown'];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg border border-gray-200 p-8 shadow-sm">
          <Link href="/" className="inline-block text-2xl font-bold text-blue-600 mb-6">
            CompetitorWatch
          </Link>

          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>

          <h1 className="text-2xl font-bold text-center mb-3">Sign in error</h1>
          <p className="text-gray-600 text-center mb-6">
            {message}
          </p>

          <div className="space-y-3">
            <Link
              href="/auth/signin"
              className="block w-full px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors text-center"
            >
              Try again
            </Link>
            <Link
              href="/"
              className="block w-full px-4 py-2 bg-white border border-gray-200 text-gray-900 rounded-lg font-medium hover:bg-gray-50 transition-colors text-center"
            >
              Back home
            </Link>
          </div>

          <p className="text-center text-sm text-gray-600 mt-6">
            Need help?{' '}
            <Link href="#" className="text-blue-600 hover:text-blue-700 font-medium">
              Contact support
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function AuthError() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <AuthErrorContent />
    </Suspense>
  );
}

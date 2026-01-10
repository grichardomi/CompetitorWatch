import Link from 'next/link';

export default function VerifyEmail() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg border border-gray-200 p-8 shadow-sm text-center">
          <Link href="/" className="inline-block text-2xl font-bold text-blue-600 mb-6">
            CompetitorWatch
          </Link>

          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>

          <h1 className="text-2xl font-bold mb-3">Check your email</h1>
          <p className="text-gray-600 mb-6">
            We&apos;ve sent a sign in link to your email address. Click the link to verify your email and sign in.
          </p>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-left">
            <h3 className="font-semibold text-blue-900 mb-2">What&apos;s next?</h3>
            <ul className="text-sm text-blue-800 space-y-2">
              <li>✓ Check your email (including spam folder)</li>
              <li>✓ Click the sign in link</li>
              <li>✓ You&apos;ll be redirected to your dashboard</li>
            </ul>
          </div>

          <p className="text-sm text-gray-600">
            Didn&apos;t receive the email?{' '}
            <Link href="/auth/signin" className="text-blue-600 hover:text-blue-700 font-medium">
              Try signing in again
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

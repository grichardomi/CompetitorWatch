import Link from 'next/link';

export default function TermsPage() {
  return (
    <>
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 sm:px-6 py-4">
          <Link href="/" className="text-xl font-bold text-blue-600">
            MarketPulse
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 sm:px-6 py-8 md:py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Terms of Service
          </h1>
          <p className="text-gray-600 mb-8">
            Last updated: January 2026
          </p>

          <div className="bg-white rounded-lg border border-gray-200 p-6 md:p-8 space-y-8">
            {/* Acceptance */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                1. Acceptance of Terms
              </h2>
              <p className="text-gray-600 leading-relaxed">
                By accessing and using MarketPulse, you accept and agree to be bound by these
                Terms of Service and our Privacy Policy. If you do not agree to these terms,
                please do not use our service.
              </p>
            </section>

            {/* Service Description */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                2. Service Description
              </h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                MarketPulse is a competitive intelligence platform that monitors publicly
                available information from competitor websites. We provide:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
                <li>Automated website monitoring and data collection</li>
                <li>Price tracking and change detection</li>
                <li>Alert notifications and reporting</li>
                <li>Data analytics and insights</li>
              </ul>
            </section>

            {/* Account Registration */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                3. Account Registration
              </h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    3.1 Account Requirements
                  </h3>
                  <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
                    <li>You must be 18 years or older</li>
                    <li>Provide accurate and complete information</li>
                    <li>Maintain the security of your account credentials</li>
                    <li>One account per user or business</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    3.2 Account Responsibility
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    You are responsible for all activity under your account. Notify us
                    immediately of any unauthorized access or security breaches.
                  </p>
                </div>
              </div>
            </section>

            {/* Acceptable Use */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                4. Acceptable Use Policy
              </h2>
              <p className="text-gray-600 mb-4">You agree NOT to:</p>
              <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
                <li>Use the service for any illegal purposes</li>
                <li>Attempt to access or scrape data beyond your subscription limits</li>
                <li>Reverse engineer or attempt to extract our source code</li>
                <li>Interfere with or disrupt the service</li>
                <li>Share your account credentials with others</li>
                <li>Resell or redistribute our data without permission</li>
                <li>Use the service to harass or harm others</li>
              </ul>
            </section>

            {/* Subscription and Billing */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                5. Subscription and Billing
              </h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    5.1 Subscription Plans
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    We offer various subscription tiers with different features and limits.
                    Pricing is displayed on our website and may change with notice.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    5.2 Billing
                  </h3>
                  <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
                    <li>Subscriptions are billed monthly or annually</li>
                    <li>Automatic renewal unless cancelled</li>
                    <li>Payment processed through Stripe</li>
                    <li>Taxes may apply based on location</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    5.3 Cancellation and Refunds
                  </h3>
                  <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
                    <li>Cancel anytime through your account settings</li>
                    <li>Access continues until end of billing period</li>
                    <li>14-day money-back guarantee for new subscriptions</li>
                    <li>No refunds for partial months or unused features</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Data and Privacy */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                6. Data and Privacy
              </h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    6.1 Your Data
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    You retain ownership of your account data. We use your data as described
                    in our Privacy Policy.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    6.2 Collected Data
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    Data collected from monitored websites is publicly available information.
                    We do not access or collect private or password-protected data.
                  </p>
                </div>
              </div>
            </section>

            {/* Intellectual Property */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                7. Intellectual Property
              </h2>
              <p className="text-gray-600 leading-relaxed">
                MarketPulse and its content, features, and functionality are owned by us and
                protected by copyright, trademark, and other intellectual property laws.
                You may not copy, modify, or distribute our platform without permission.
              </p>
            </section>

            {/* Service Availability */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                8. Service Availability
              </h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                We strive to provide reliable service but do not guarantee:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
                <li>Uninterrupted or error-free service</li>
                <li>Accuracy or completeness of collected data</li>
                <li>Availability of specific competitor websites</li>
                <li>Immunity from security breaches or data loss</li>
              </ul>
            </section>

            {/* Limitation of Liability */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                9. Limitation of Liability
              </h2>
              <p className="text-gray-600 leading-relaxed">
                To the maximum extent permitted by law, MarketPulse shall not be liable for
                any indirect, incidental, special, consequential, or punitive damages resulting
                from your use of the service.
              </p>
            </section>

            {/* Termination */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                10. Termination
              </h2>
              <p className="text-gray-600 leading-relaxed">
                We may suspend or terminate your account if you violate these terms or engage
                in prohibited activities. Upon termination, your right to use the service
                ceases immediately.
              </p>
            </section>

            {/* Changes to Terms */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                11. Changes to Terms
              </h2>
              <p className="text-gray-600 leading-relaxed">
                We reserve the right to modify these terms at any time. We will notify users
                of significant changes. Continued use of the service constitutes acceptance
                of modified terms.
              </p>
            </section>

            {/* Governing Law */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                12. Governing Law
              </h2>
              <p className="text-gray-600 leading-relaxed">
                These terms are governed by the laws of the United States. Any disputes shall
                be resolved through binding arbitration.
              </p>
            </section>

            {/* Contact */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                13. Contact Information
              </h2>
              <p className="text-gray-600 leading-relaxed">
                For questions about these Terms of Service, contact us at{' '}
                <a
                  href="mailto:legal@getmarketpulse.com"
                  className="text-blue-600 hover:underline"
                >
                  legal@getmarketpulse.com
                </a>
              </p>
            </section>
          </div>

          {/* Footer Links */}
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-600">
              Also see our{' '}
              <Link href="/privacy" className="text-blue-600 hover:underline">
                Privacy Policy
              </Link>
            </p>
          </div>
        </div>
      </main>
    </>
  );
}

import Link from 'next/link';

export default function AboutPage() {
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
          {/* Hero */}
          <div className="text-center mb-12">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              About MarketPulse
            </h1>
            <p className="text-lg md:text-xl text-gray-600">
              Helping businesses stay competitive through intelligent market monitoring
            </p>
          </div>

          {/* Mission */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 md:p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Our Mission</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              MarketPulse was built to empower small and medium-sized businesses with the same
              competitive intelligence tools that large enterprises use. We believe that every
              business deserves access to real-time market data to make informed pricing and
              strategy decisions.
            </p>
            <p className="text-gray-600 leading-relaxed">
              Our platform automates the tedious task of monitoring competitors, allowing you
              to focus on what matters most - growing your business and serving your customers.
            </p>
          </div>

          {/* What We Do */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 md:p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">What We Do</h2>
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="text-3xl flex-shrink-0">📊</div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Real-Time Monitoring
                  </h3>
                  <p className="text-gray-600">
                    Track your competitors&apos; pricing, promotions, and product changes automatically.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="text-3xl flex-shrink-0">🔔</div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Instant Alerts
                  </h3>
                  <p className="text-gray-600">
                    Get notified immediately when your competitors make changes that matter.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="text-3xl flex-shrink-0">📈</div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Actionable Insights
                  </h3>
                  <p className="text-gray-600">
                    Turn market data into strategic decisions with our analytics and reports.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Values */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 md:p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Our Values</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Transparency
                </h3>
                <p className="text-gray-600">
                  Clear pricing, honest communication, and no hidden fees.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Reliability
                </h3>
                <p className="text-gray-600">
                  24/7 monitoring with 99.9% uptime guarantee.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Privacy
                </h3>
                <p className="text-gray-600">
                  Your data is yours. We never share or sell your information.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Support
                </h3>
                <p className="text-gray-600">
                  Real humans ready to help you succeed.
                </p>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 md:p-8 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Ready to get started?
            </h2>
            <p className="text-gray-600 mb-6">
              Join hundreds of businesses using MarketPulse to stay ahead of their competition.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/auth/signup"
                className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Start Free Trial
              </Link>
              <Link
                href="/contact"
                className="px-8 py-3 bg-white text-blue-600 border-2 border-blue-600 rounded-lg hover:bg-blue-50 transition-colors font-medium"
              >
                Contact Sales
              </Link>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}

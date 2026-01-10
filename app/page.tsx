import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Navigation */}
      <nav className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-gray-200">
        <div className="text-2xl font-bold text-blue-600">CompetitorWatch</div>
        <div className="flex gap-4">
          <Link href="/auth/signin" className="px-4 py-2 text-gray-600 hover:text-gray-900">
            Sign In
          </Link>
          <Link href="/auth/signin" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="container mx-auto px-4 py-16 sm:py-24 text-center">
        <h1 className="text-4xl sm:text-5xl font-bold mb-4">
          Monitor Your Competitors Effortlessly
        </h1>
        <p className="text-lg sm:text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          Get instant alerts on competitor pricing changes, new promotions, and service updates. Stay ahead of the competition with real-time intelligence.
        </p>
        <Link href="/auth/signin" className="inline-block px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700">
          Start Your 14-Day Free Trial
        </Link>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-16 sm:py-24">
        <h2 className="text-3xl font-bold text-center mb-12">Why Choose CompetitorWatch?</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {[
            { title: 'Real-Time Alerts', desc: 'Get instant notifications when competitors change prices or promotions' },
            { title: 'AI-Powered Insights', desc: 'Claude AI extracts and analyzes competitor data automatically' },
            { title: 'Easy Setup', desc: 'Add competitors in seconds, start monitoring immediately' },
            { title: 'Mobile-First', desc: 'Check alerts on the go with our mobile-optimized platform' },
            { title: 'Flexible Webhooks', desc: 'Send alerts to Slack, custom apps, or your own endpoints' },
            { title: 'Affordable Pricing', desc: 'Starting at $49/month for up to 5 competitors' },
          ].map((feature, idx) => (
            <div key={idx} className="bg-white p-6 rounded-lg border border-gray-200">
              <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
              <p className="text-gray-600">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-8 px-4">
        <div className="container mx-auto text-center text-gray-600">
          <p>&copy; 2024 CompetitorWatch. All rights reserved.</p>
        </div>
      </footer>
    </main>
  );
}

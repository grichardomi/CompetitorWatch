'use client';

import Link from 'next/link';

interface DocSection {
  id: string;
  title: string;
  description: string;
  icon: string;
  articles: { id: string; title: string }[];
}

const docSections: DocSection[] = [
  {
    id: 'api',
    title: 'API Reference',
    description: 'Complete API documentation for developers',
    icon: '🔌',
    articles: [
      { id: 'authentication', title: 'Authentication' },
      { id: 'competitors-api', title: 'Competitors API' },
      { id: 'alerts-api', title: 'Alerts API' },
      { id: 'webhooks', title: 'Webhooks' },
      { id: 'rate-limits', title: 'Rate Limits' },
    ],
  },
  {
    id: 'integrations',
    title: 'Integrations',
    description: 'Connect MarketPulse with your favorite tools',
    icon: '🔗',
    articles: [
      { id: 'slack', title: 'Slack Integration' },
      { id: 'zapier', title: 'Zapier' },
      { id: 'webhook-setup', title: 'Webhook Setup' },
    ],
  },
  {
    id: 'guides',
    title: 'Developer Guides',
    description: 'Step-by-step tutorials for common use cases',
    icon: '📚',
    articles: [
      { id: 'quickstart', title: 'Quick Start Guide' },
      { id: 'custom-dashboards', title: 'Building Custom Dashboards' },
      { id: 'automated-reporting', title: 'Automated Reporting' },
    ],
  },
  {
    id: 'advanced',
    title: 'Advanced Features',
    description: 'Power user features and configurations',
    icon: '⚡',
    articles: [
      { id: 'custom-scraping', title: 'Custom Scraping Rules' },
      { id: 'advanced-filters', title: 'Advanced Filters' },
      { id: 'bulk-operations', title: 'Bulk Operations' },
    ],
  },
];

export default function DocumentationPage() {
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

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white py-12 md:py-16">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              Documentation
            </h1>
            <p className="text-base md:text-lg text-blue-100">
              Everything you need to integrate and extend MarketPulse
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-4 sm:px-6 py-8 md:py-12">
        <div className="max-w-6xl mx-auto">
          {/* Quick Links */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
            <Link
              href="/docs/quickstart"
              className="bg-white border-2 border-blue-500 rounded-lg p-6 hover:shadow-lg transition-shadow"
            >
              <div className="text-3xl mb-3">🚀</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Quick Start
              </h3>
              <p className="text-sm text-gray-600">
                Get started with MarketPulse in minutes
              </p>
            </Link>

            <Link
              href="/docs/authentication"
              className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow"
            >
              <div className="text-3xl mb-3">🔐</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                API Keys
              </h3>
              <p className="text-sm text-gray-600">
                Authentication and API access
              </p>
            </Link>

            <Link
              href="/docs/webhooks"
              className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow"
            >
              <div className="text-3xl mb-3">🔔</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Webhooks
              </h3>
              <p className="text-sm text-gray-600">
                Real-time event notifications
              </p>
            </Link>
          </div>

          {/* Documentation Sections */}
          <div className="space-y-8">
            {docSections.map((section) => (
              <div key={section.id} className="bg-white rounded-lg border border-gray-200 p-6 md:p-8">
                <div className="flex items-start gap-4 mb-6">
                  <div className="text-4xl">{section.icon}</div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                      {section.title}
                    </h2>
                    <p className="text-gray-600">{section.description}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {section.articles.map((article) => (
                    <Link
                      key={article.id}
                      href={`/docs/${article.id}`}
                      className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors group"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-gray-900 font-medium">
                          {article.title}
                        </span>
                        <span className="text-gray-400 group-hover:text-blue-600 transition-colors">
                          →
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* API Status */}
          <div className="mt-12 bg-white rounded-lg border border-gray-200 p-6 text-center">
            <div className="inline-flex items-center gap-2 mb-4">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-gray-900">
                All systems operational
              </span>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Check our{' '}
              <Link href="/status" className="text-blue-600 hover:underline">
                status page
              </Link>{' '}
              for real-time updates
            </p>
          </div>

          {/* Need Help */}
          <div className="mt-8 text-center">
            <p className="text-gray-600 mb-4">
              Can&apos;t find what you&apos;re looking for?
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/help"
                className="px-6 py-3 bg-white text-blue-600 border-2 border-blue-600 rounded-lg hover:bg-blue-50 transition-colors font-medium"
              >
                Visit Help Center
              </Link>
              <Link
                href="/contact"
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Contact Support
              </Link>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}

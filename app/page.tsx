'use server';

import Link from 'next/link';
import Image from 'next/image';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth/auth-options';
import Footer from '@/components/Footer';

export default async function Home() {
  const session = await getServerSession(authOptions);

  if (session) {
    redirect('/dashboard');
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Navigation */}
      <nav className="flex items-center justify-between px-4 sm:px-6 py-2 md:py-3 lg:py-4 border-b border-gray-200">
        <Link href="/">
          <Image
            src="/logo_transparent.png"
            alt="MarketPulse"
            width={500}
            height={125}
            className="h-16 md:h-16 lg:h-20 xl:h-24 w-auto"
            priority
          />
        </Link>
        <div className="flex gap-4">
          <Link href="/pricing" className="px-4 py-2 text-gray-600 hover:text-gray-900">
            Pricing
          </Link>
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
        <h2 className="text-3xl font-bold text-center mb-12">Why Choose MarketPulse?</h2>
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

      <Footer />
    </main>
  );
}

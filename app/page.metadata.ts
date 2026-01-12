import { Metadata } from 'next';
import { generateMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = generateMetadata({
  title: 'Home',
  description: 'Monitor your competitors effortlessly with MarketPulse. Get instant alerts on pricing changes, promotions, and market updates. Start your 14-day free trial today.',
  path: '/',
});

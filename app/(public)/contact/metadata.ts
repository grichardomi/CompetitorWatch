import { Metadata } from 'next';
import { generateMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = generateMetadata({
  title: 'Contact Us',
  description: 'Get in touch with the MarketPulse team. We\'re here to help with any questions about competitor monitoring and pricing intelligence.',
  path: '/contact',
});

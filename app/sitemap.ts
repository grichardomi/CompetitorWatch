import { MetadataRoute } from 'next';
import { siteConfig } from '@/lib/seo/metadata';

export default function sitemap(): MetadataRoute.Sitemap {
  const currentDate = new Date();

  // Static pages
  const routes = [
    '',
    '/pricing',
    '/about',
    '/contact',
    '/help',
    '/docs',
    '/privacy',
    '/terms',
    '/status',
  ].map((route) => ({
    url: `${siteConfig.url}${route}`,
    lastModified: currentDate,
    changeFrequency: 'weekly' as const,
    priority: route === '' ? 1.0 : 0.8,
  }));

  // Help articles
  const helpArticles = [
    'getting-started',
    'adding-competitors',
    'understanding-alerts',
    'managing-subscription',
    'price-tracking',
    'notification-settings',
    'troubleshooting',
    'account-security',
  ].map((slug) => ({
    url: `${siteConfig.url}/help/${slug}`,
    lastModified: currentDate,
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }));

  return [...routes, ...helpArticles];
}

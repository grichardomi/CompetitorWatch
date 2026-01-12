import { Metadata } from 'next';

export const siteConfig = {
  name: 'MarketPulse',
  domain: 'getmarketpulse.com',
  url: 'https://getmarketpulse.com',
  tagline: 'Feel the Pulse of Your Market',
  description: 'Monitor your competitors and stay ahead of market changes with real-time alerts. Track pricing, promotions, and product updates automatically.',
  keywords: [
    'competitor monitoring',
    'price tracking',
    'competitive intelligence',
    'market monitoring',
    'competitor analysis',
    'price alerts',
    'competitor tracking software',
    'business intelligence',
    'market research',
    'competitor price monitoring',
  ],
  authors: [{ name: 'MarketPulse' }],
  creator: 'MarketPulse',
  publisher: 'MarketPulse',
  twitter: '@marketpulse',
  email: 'contact@getmarketpulse.com',
};

export function generateMetadata({
  title,
  description,
  image = '/og-image.png',
  path = '',
  noIndex = false,
}: {
  title?: string;
  description?: string;
  image?: string;
  path?: string;
  noIndex?: boolean;
}): Metadata {
  const pageTitle = title ? `${title} | ${siteConfig.name}` : siteConfig.name;
  const pageDescription = description || siteConfig.description;
  const pageUrl = `${siteConfig.url}${path}`;
  const imageUrl = image.startsWith('http') ? image : `${siteConfig.url}${image}`;

  return {
    title: pageTitle,
    description: pageDescription,
    keywords: siteConfig.keywords,
    authors: siteConfig.authors,
    creator: siteConfig.creator,
    publisher: siteConfig.publisher,
    metadataBase: new URL(siteConfig.url),
    alternates: {
      canonical: pageUrl,
    },
    openGraph: {
      type: 'website',
      locale: 'en_US',
      url: pageUrl,
      title: pageTitle,
      description: pageDescription,
      siteName: siteConfig.name,
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: pageTitle,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      site: siteConfig.twitter,
      creator: siteConfig.twitter,
      title: pageTitle,
      description: pageDescription,
      images: [imageUrl],
    },
    robots: noIndex
      ? {
          index: false,
          follow: false,
        }
      : {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            'max-video-preview': -1,
            'max-image-preview': 'large',
            'max-snippet': -1,
          },
        },
    viewport: {
      width: 'device-width',
      initialScale: 1,
      maximumScale: 5,
    },
    verification: {
      google: 'your-google-site-verification-code', // Add actual code when available
      // yandex: 'your-yandex-verification-code',
      // bing: 'your-bing-verification-code',
    },
  };
}

// Structured data for organization
export const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: siteConfig.name,
  url: siteConfig.url,
  logo: `${siteConfig.url}/logo_transparent.png`,
  description: siteConfig.description,
  email: siteConfig.email,
  sameAs: [
    'https://twitter.com/marketpulse',
    'https://github.com/marketpulse',
    'https://linkedin.com/company/marketpulse',
  ],
  contactPoint: {
    '@type': 'ContactPoint',
    email: siteConfig.email,
    contactType: 'Customer Support',
    availableLanguage: ['English'],
  },
};

// Structured data for software application
export const softwareApplicationSchema = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: siteConfig.name,
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web',
  offers: {
    '@type': 'Offer',
    price: '49',
    priceCurrency: 'USD',
    priceValidUntil: '2027-12-31',
  },
  aggregateRating: {
    '@type': 'AggregateRating',
    ratingValue: '4.8',
    ratingCount: '127',
  },
  description: siteConfig.description,
  url: siteConfig.url,
  screenshot: `${siteConfig.url}/screenshots/dashboard.png`,
};

// FAQ Schema (for help pages)
export function generateFAQSchema(faqs: { question: string; answer: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
}

// Article Schema (for blog posts/help articles)
export function generateArticleSchema({
  title,
  description,
  datePublished,
  dateModified,
  author,
  image,
}: {
  title: string;
  description: string;
  datePublished: string;
  dateModified?: string;
  author?: string;
  image?: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: title,
    description: description,
    image: image || `${siteConfig.url}/og-image.png`,
    datePublished: datePublished,
    dateModified: dateModified || datePublished,
    author: {
      '@type': 'Organization',
      name: author || siteConfig.name,
    },
    publisher: {
      '@type': 'Organization',
      name: siteConfig.name,
      logo: {
        '@type': 'ImageObject',
        url: `${siteConfig.url}/logo_transparent.png`,
      },
    },
  };
}

// Breadcrumb Schema
export function generateBreadcrumbSchema(items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: `${siteConfig.url}${item.url}`,
    })),
  };
}

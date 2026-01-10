/**
 * Format a date as relative time (e.g., "2 hours ago", "3 days ago")
 */
export function formatRelativeTime(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const seconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);

  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;

  return dateObj.toLocaleDateString();
}

/**
 * Calculate next scheduled crawl time
 */
export function calculateNextCrawl(
  lastCrawledAt: Date | string | null,
  crawlFrequencyMinutes: number
): string {
  if (!lastCrawledAt) {
    return 'Soon';
  }

  const lastDate = typeof lastCrawledAt === 'string' ? new Date(lastCrawledAt) : lastCrawledAt;
  const nextDate = new Date(lastDate.getTime() + crawlFrequencyMinutes * 60000);
  const now = new Date();

  if (nextDate <= now) {
    return 'In progress';
  }

  const minutes = Math.floor((nextDate.getTime() - now.getTime()) / 60000);
  if (minutes < 60) return `in ${minutes}m`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `in ${hours}h`;

  const days = Math.floor(hours / 24);
  return `in ${days}d`;
}

/**
 * Format frequency minutes to human-readable text
 */
export function formatFrequency(minutes: number): string {
  const hours = minutes / 60;
  if (hours < 24) return `Every ${hours} hours`;
  const days = hours / 24;
  return `Every ${days} days`;
}

/**
 * Extract hostname from URL
 */
export function getHostname(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

/**
 * Normalize URL by adding https:// if missing
 */
export function normalizeUrl(url: string): string {
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return `https://${url}`;
  }
  return url;
}

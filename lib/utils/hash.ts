import crypto from 'crypto';

/**
 * Generate SHA-256 hash of content
 */
export function hashContent(content: string): string {
  return crypto.createHash('sha256').update(content).digest('hex');
}

/**
 * Normalize content before hashing (remove timestamps, dynamic elements)
 * This helps with cache hits when content structure is same but has minor updates
 */
export function normalizeContent(content: string): string {
  // Remove common dynamic elements
  let normalized = content
    // Remove timestamps and dates
    .replace(/\d{1,4}[-/]\d{1,2}[-/]\d{1,4}/g, '')
    // Remove times
    .replace(/\d{1,2}:\d{2}(:\d{2})?/g, '')
    // Remove UUIDs
    .replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, '')
    // Remove query parameters and fragments
    .replace(/[?#].*$/gm, '')
    // Remove whitespace variations
    .replace(/\s+/g, ' ')
    .trim();

  return normalized;
}

/**
 * Get hash of normalized content for caching
 */
export function getNormalizedHash(content: string): string {
  return hashContent(normalizeContent(content));
}

/**
 * URL resolution and deduplication utilities
 * Cost: $0 (pure JavaScript processing)
 */

import type { RankedCompetitor } from './ai-ranker';

/**
 * Resolve URLs and remove duplicates based on canonical domain
 */
export function resolveAndDedupe(
  competitors: RankedCompetitor[]
): RankedCompetitor[] {
  const seen = new Set<string>();
  const resolved: RankedCompetitor[] = [];

  for (const comp of competitors) {
    try {
      // Parse and canonicalize URL
      const url = new URL(comp.website);

      // Remove www prefix and standardize
      const canonical = url.hostname
        .replace(/^www\./, '')
        .toLowerCase()
        .trim();

      // Skip duplicates
      if (seen.has(canonical)) {
        console.log(`Skipping duplicate: ${canonical}`);
        continue;
      }

      seen.add(canonical);

      // Clean URL (remove unnecessary parts)
      const cleanUrl = `${url.protocol}//${url.hostname}${url.pathname === '/' ? '' : url.pathname}`;

      resolved.push({
        ...comp,
        website: cleanUrl,
      });
    } catch (error) {
      // Invalid URL, skip
      console.warn(`Invalid URL skipped: ${comp.website}`, error);
    }
  }

  return resolved;
}

/**
 * Optional: Validate that URLs are actually reachable
 * Note: This adds latency (~1-2 seconds per URL)
 * Use sparingly or as background job
 */
export async function validateUrls(
  competitors: RankedCompetitor[],
  options: {
    timeout?: number;
    parallel?: number;
  } = {}
): Promise<RankedCompetitor[]> {
  const { timeout = 5000, parallel = 5 } = options;
  const validated: RankedCompetitor[] = [];

  // Process in batches to avoid overwhelming
  for (let i = 0; i < competitors.length; i += parallel) {
    const batch = competitors.slice(i, i + parallel);

    const results = await Promise.allSettled(
      batch.map(async (comp) => {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), timeout);

          const response = await fetch(comp.website, {
            method: 'HEAD',
            signal: controller.signal,
            redirect: 'follow',
          });

          clearTimeout(timeoutId);

          if (response.ok || response.status === 405) {
            // 405 = Method Not Allowed (some servers don't support HEAD)
            return comp;
          }

          return null;
        } catch (error) {
          console.warn(`URL not reachable: ${comp.website}`, error);
          return null;
        }
      })
    );

    // Add successful results
    results.forEach((result) => {
      if (result.status === 'fulfilled' && result.value) {
        validated.push(result.value);
      }
    });
  }

  return validated;
}

/**
 * Extract domain from URL for comparison
 */
export function extractDomain(url: string): string | null {
  try {
    const parsed = new URL(url);
    return parsed.hostname.replace(/^www\./, '').toLowerCase();
  } catch {
    return null;
  }
}

/**
 * Check if two URLs are from the same domain
 */
export function isSameDomain(url1: string, url2: string): boolean {
  const domain1 = extractDomain(url1);
  const domain2 = extractDomain(url2);
  return domain1 !== null && domain1 === domain2;
}

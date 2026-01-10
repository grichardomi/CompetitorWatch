import { db } from '@/lib/db/prisma';

const RATE_LIMIT_REQUESTS_PER_HOUR = parseInt(
  process.env.RATE_LIMIT_REQUESTS_PER_HOUR || '10',
  10
);

/**
 * Extract domain from URL
 */
function getDomain(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname || url;
  } catch {
    return url;
  }
}

/**
 * Check if domain is within rate limit
 */
export async function checkRateLimit(url: string): Promise<boolean> {
  const domain = getDomain(url);
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

  try {
    // Get or create rate limit entry
    let rateLimit = await db.rateLimit.findUnique({
      where: { domain },
    });

    if (!rateLimit) {
      // First request to this domain
      await db.rateLimit.create({
        data: {
          domain,
          requestCount: 1,
          windowStart: now,
        },
      });
      return true;
    }

    // Check if window has expired
    const windowExpired = rateLimit.windowStart < oneHourAgo;

    if (windowExpired) {
      // Reset counter for new window
      await db.rateLimit.update({
        where: { domain },
        data: {
          requestCount: 1,
          windowStart: now,
        },
      });
      return true;
    }

    // Within same window - check if over limit
    if (rateLimit.requestCount >= RATE_LIMIT_REQUESTS_PER_HOUR) {
      console.log(
        `Rate limit exceeded for ${domain}: ${rateLimit.requestCount}/${RATE_LIMIT_REQUESTS_PER_HOUR}`
      );
      return false;
    }

    // Within limit - increment counter
    await db.rateLimit.update({
      where: { domain },
      data: {
        requestCount: {
          increment: 1,
        },
      },
    });

    return true;
  } catch (error) {
    console.error(`Rate limit check failed for ${domain}:`, error);
    // On error, allow request (fail-open for resilience)
    return true;
  }
}

/**
 * Get current rate limit status for a domain
 */
export async function getRateLimitStatus(url: string): Promise<{
  domain: string;
  remaining: number;
  total: number;
  windowStart: Date;
}> {
  const domain = getDomain(url);
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

  try {
    let rateLimit = await db.rateLimit.findUnique({
      where: { domain },
    });

    if (!rateLimit) {
      // Never crawled
      return {
        domain,
        remaining: RATE_LIMIT_REQUESTS_PER_HOUR,
        total: RATE_LIMIT_REQUESTS_PER_HOUR,
        windowStart: now,
      };
    }

    // Check if window expired
    if (rateLimit.windowStart < oneHourAgo) {
      // Window expired - return fresh limits
      return {
        domain,
        remaining: RATE_LIMIT_REQUESTS_PER_HOUR,
        total: RATE_LIMIT_REQUESTS_PER_HOUR,
        windowStart: now,
      };
    }

    // Within window
    return {
      domain,
      remaining: Math.max(0, RATE_LIMIT_REQUESTS_PER_HOUR - rateLimit.requestCount),
      total: RATE_LIMIT_REQUESTS_PER_HOUR,
      windowStart: rateLimit.windowStart,
    };
  } catch (error) {
    console.error(`Failed to get rate limit status for ${domain}:`, error);
    return {
      domain,
      remaining: RATE_LIMIT_REQUESTS_PER_HOUR,
      total: RATE_LIMIT_REQUESTS_PER_HOUR,
      windowStart: now,
    };
  }
}

/**
 * Reset rate limit for a domain (admin operation)
 */
export async function resetRateLimit(url: string): Promise<void> {
  const domain = getDomain(url);

  try {
    await db.rateLimit.delete({
      where: { domain },
    });
    console.log(`Rate limit reset for ${domain}`);
  } catch (error) {
    console.error(`Failed to reset rate limit for ${domain}:`, error);
  }
}

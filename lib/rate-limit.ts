import { NextRequest, NextResponse } from 'next/server';

interface RateLimitStore {
  count: number;
  resetTime: number;
}

const store = new Map<string, RateLimitStore>();

interface RateLimitConfig {
  interval: number;
  uniqueTokenPerInterval: number;
}

export function rateLimit(config: RateLimitConfig) {
  const { interval } = config;

  return {
    check: (_req: NextRequest, limit: number, token: string): { success: boolean; limit: number; remaining: number; reset: number } => {
      const tokenKey = `${token}`;
      const now = Date.now();
      const tokenData = store.get(tokenKey);

      if (!tokenData || now > tokenData.resetTime) {
        store.set(tokenKey, {
          count: 1,
          resetTime: now + interval,
        });

        return {
          success: true,
          limit,
          remaining: limit - 1,
          reset: now + interval,
        };
      }

      if (tokenData.count >= limit) {
        return {
          success: false,
          limit,
          remaining: 0,
          reset: tokenData.resetTime,
        };
      }

      tokenData.count += 1;
      store.set(tokenKey, tokenData);

      return {
        success: true,
        limit,
        remaining: limit - tokenData.count,
        reset: tokenData.resetTime,
      };
    },
  };
}

export const apiLimiter = rateLimit({
  interval: 60 * 1000,
  uniqueTokenPerInterval: 500,
});

export const authLimiter = rateLimit({
  interval: 15 * 60 * 1000,
  uniqueTokenPerInterval: 500,
});

export function getClientIdentifier(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0] : req.headers.get('x-real-ip') || 'unknown';
  return ip;
}

export function rateLimitResponse(reset: number) {
  return NextResponse.json(
    { error: 'Too many requests. Please try again later.' },
    {
      status: 429,
      headers: {
        'X-RateLimit-Reset': new Date(reset).toISOString(),
        'Retry-After': String(Math.ceil((reset - Date.now()) / 1000)),
      },
    }
  );
}

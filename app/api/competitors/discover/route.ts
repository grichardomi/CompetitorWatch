import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { searchGoogleCustom } from '@/lib/discovery/search';
import { rankWithAI } from '@/lib/discovery/ai-ranker';
import { resolveAndDedupe } from '@/lib/discovery/url-resolver';
import { getCached, saveToCache } from '@/lib/discovery/cache';
import { db as prisma } from '@/lib/db/prisma';

interface DiscoverRequest {
  industry: string;
  city: string;
  state: string;
  zipcode?: string;
}

export async function POST(req: Request) {
  const startTime = Date.now();

  try {
    // Authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Parse request body
    const body: DiscoverRequest = await req.json();
    const { industry, city, state, zipcode } = body;

    // Validation
    if (!industry || !city || !state) {
      return NextResponse.json(
        { error: 'Industry, city, and state are required' },
        { status: 400 }
      );
    }

    // Normalize inputs
    const normalizedIndustry = industry.trim();
    const normalizedCity = city.trim();
    const normalizedState = state.trim().toUpperCase();

    console.log(`[Discovery] Starting for: ${normalizedIndustry} in ${normalizedCity}, ${normalizedState}`);

    // Step 0: Check cache first
    const cached = await getCached(normalizedIndustry, normalizedCity, normalizedState);
    if (cached && cached.length > 0) {
      console.log(`[Discovery] Cache HIT - returning ${cached.length} cached results`);

      // Track analytics
      await trackDiscovery(
        user.id,
        normalizedIndustry,
        normalizedCity,
        normalizedState,
        cached.length,
        true,
        Date.now() - startTime
      );

      return NextResponse.json({
        success: true,
        competitors: cached,
        cached: true,
        count: cached.length,
      });
    }

    console.log('[Discovery] Cache MISS - performing fresh discovery');

    // Step 1: Seed candidates (free search)
    console.log('[Discovery] Step 1: Searching for candidates...');
    const searchResults = await searchGoogleCustom(
      normalizedIndustry,
      normalizedCity,
      normalizedState,
      zipcode
    );

    console.log(`[Discovery] Found ${searchResults.length} search results`);

    if (searchResults.length === 0) {
      return NextResponse.json({
        success: true,
        competitors: [],
        cached: false,
        count: 0,
        message: 'No competitors found in this area. Try a different location or industry.',
      });
    }

    // Step 2: AI re-ranker
    console.log('[Discovery] Step 2: Ranking with AI...');
    const ranked = await rankWithAI(
      searchResults,
      normalizedIndustry,
      `${normalizedCity}, ${normalizedState}`
    );

    console.log(`[Discovery] AI ranked ${ranked.length} competitors`);

    if (ranked.length === 0) {
      return NextResponse.json({
        success: true,
        competitors: [],
        cached: false,
        count: 0,
        message: 'No valid competitors found after filtering. Try adjusting your search criteria.',
      });
    }

    // Step 3: URL resolution & deduplication
    console.log('[Discovery] Step 3: Resolving URLs...');
    const resolved = resolveAndDedupe(ranked);

    console.log(`[Discovery] Final result: ${resolved.length} unique competitors`);

    // Step 4: Cache results
    await saveToCache(normalizedIndustry, normalizedCity, normalizedState, resolved);

    // Track analytics
    const duration = Date.now() - startTime;
    await trackDiscovery(
      user.id,
      normalizedIndustry,
      normalizedCity,
      normalizedState,
      resolved.length,
      false,
      duration
    );

    console.log(`[Discovery] Completed in ${duration}ms`);

    return NextResponse.json({
      success: true,
      competitors: resolved,
      cached: false,
      count: resolved.length,
    });
  } catch (error) {
    console.error('[Discovery] Error:', error);

    // Check for specific error types
    if (error instanceof Error) {
      if (error.message.includes('API key not configured')) {
        return NextResponse.json(
          {
            success: false,
            error: 'Discovery service is not configured. Please contact support.',
          },
          { status: 503 }
        );
      }

      if (error.message.includes('quota')) {
        return NextResponse.json(
          {
            success: false,
            error: 'Discovery service is temporarily unavailable. Please try again later.',
          },
          { status: 503 }
        );
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to discover competitors. Please try again.',
      },
      { status: 500 }
    );
  }
}

/**
 * Track discovery event for analytics
 */
async function trackDiscovery(
  userId: number,
  industry: string,
  city: string,
  state: string,
  resultCount: number,
  cached: boolean,
  duration: number
): Promise<void> {
  try {
    await prisma.discoveryEvent.create({
      data: {
        userId,
        industry,
        city,
        state,
        resultCount,
        cached,
        duration,
      },
    });
  } catch (error) {
    // Don't fail the request if analytics tracking fails
    console.error('[Discovery] Analytics tracking error:', error);
  }
}

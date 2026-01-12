import { NextResponse } from 'next/server';
import { searchGoogleCustom } from '@/lib/discovery/search';
import { rankWithAI } from '@/lib/discovery/ai-ranker';
import { resolveAndDedupe } from '@/lib/discovery/url-resolver';
import { getCached, saveToCache, getCacheKey } from '@/lib/discovery/cache';

/**
 * Test endpoint for competitor discovery (NO AUTH REQUIRED)
 * Remove this file in production!
 *
 * Test with:
 * curl http://localhost:3000/api/test-discovery
 */
export async function GET() {
  const startTime = Date.now();

  try {
    console.log('🧪 Testing Competitor Discovery Feature...');

    // Test parameters
    const industry = 'Pizza Restaurant';
    const city = 'Austin';
    const state = 'TX';

    // Step 1: Check environment variables
    const hasOpenAI = !!process.env.OPENAI_API_KEY;
    const hasGoogleKey = !!process.env.GOOGLE_SEARCH_API_KEY;
    const hasGoogleEngine = !!process.env.GOOGLE_SEARCH_ENGINE_ID;

    if (!hasOpenAI || !hasGoogleKey || !hasGoogleEngine) {
      return NextResponse.json({
        success: false,
        error: 'Missing required API keys',
        config: {
          openai: hasOpenAI,
          googleKey: hasGoogleKey,
          googleEngine: hasGoogleEngine,
        },
      }, { status: 500 });
    }

    // Step 2: Check cache first
    console.log('Checking cache...');
    const cacheKey = getCacheKey(industry, city, state);
    const cached = await getCached(industry, city, state);

    if (cached && cached.length > 0) {
      console.log(`Cache HIT - returning ${cached.length} cached results`);
      return NextResponse.json({
        success: true,
        message: 'Competitor discovery test successful (cached)',
        cached: true,
        competitors: cached.slice(0, 5), // Return top 5
        stats: {
          totalFound: cached.length,
          cached: true,
          duration: Date.now() - startTime,
          cacheKey,
        },
      });
    }

    // Step 3: Search for candidates
    console.log('Searching for candidates...');
    const searchResults = await searchGoogleCustom(industry, city, state);
    console.log(`Found ${searchResults.length} search results`);

    if (searchResults.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No search results found',
        message: 'Check Google Custom Search configuration',
      }, { status: 404 });
    }

    // Step 4: AI ranking
    console.log('Ranking with AI...');
    const ranked = await rankWithAI(searchResults, industry, `${city}, ${state}`);
    console.log(`AI ranked ${ranked.length} competitors`);

    if (ranked.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No valid competitors after AI filtering',
        message: 'AI filtered out all results',
      }, { status: 404 });
    }

    // Step 5: URL resolution
    console.log('Resolving URLs...');
    const resolved = resolveAndDedupe(ranked);
    console.log(`Final result: ${resolved.length} unique competitors`);

    // Step 6: Save to cache
    console.log('Saving to cache...');
    await saveToCache(industry, city, state, resolved);

    const duration = Date.now() - startTime;
    console.log(`✅ Test completed in ${duration}ms`);

    return NextResponse.json({
      success: true,
      message: 'Competitor discovery test successful!',
      cached: false,
      competitors: resolved.slice(0, 5), // Return top 5
      stats: {
        searchResults: searchResults.length,
        aiRanked: ranked.length,
        finalUnique: resolved.length,
        duration,
        cacheKey,
      },
    });

  } catch (error) {
    console.error('Test error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    }, { status: 500 });
  }
}

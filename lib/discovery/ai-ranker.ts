/**
 * AI-powered competitor ranking using OpenAI GPT-4o-mini
 * Cost: ~$0.0002 per session (500 input + 200 output tokens)
 */

import OpenAI from 'openai';
import type { SearchResult } from './search';

export interface RankedCompetitor {
  name: string;
  website: string;
  relevanceScore: number;
  matchReason: string;
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function rankWithAI(
  searchResults: SearchResult[],
  industry: string,
  location: string
): Promise<RankedCompetitor[]> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OpenAI API key not configured');
  }

  if (searchResults.length === 0) {
    return [];
  }

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      response_format: { type: 'json_object' },
      temperature: 0.3, // More deterministic results
      messages: [
        {
          role: 'system',
          content: `You are an expert at identifying business competitors for market intelligence.
Your job is to filter and rank search results to find legitimate local competitors.
Always return valid JSON in the exact format specified.`,
        },
        {
          role: 'user',
          content: `Task: Find the best competitors for a ${industry} business in ${location}.

Search Results:
${JSON.stringify(searchResults, null, 2)}

Instructions:
1. FILTER OUT (remove completely):
   - Directories (Yelp, TripAdvisor, Yellow Pages, Google Maps, Foursquare)
   - Marketplaces (Uber Eats, DoorDash, Grubhub, Postmates)
   - National aggregators and listing sites
   - Social media profiles (Facebook, Instagram, Twitter) unless no website exists
   - News articles, blogs, review sites
   - Businesses from wrong categories or industries
   - Corporate parent sites (unless they're the actual competitor)

2. KEEP (and rank):
   - Independent local businesses with official websites
   - Direct competitors in the same industry
   - Regional or local chains relevant to the area
   - Businesses that are currently operational
   - Businesses with clear online presence

3. RANK by relevance (1-100 scale):
   - Category match: Exact match (90-100) > Similar (70-89) > Related (50-69)
   - Website quality: Official business site (90-100) > Landing page (70-89) > Social only (40-69)
   - Business type: Independent local (90-100) > Local chain (70-89) > National chain (50-69)
   - Location relevance: Same city (90-100) > Same region (70-89) > Same state (60-79)

4. Return JSON with this exact structure:
{
  "competitors": [
    {
      "name": "Business Name",
      "website": "https://cleanurl.com",
      "relevanceScore": 95,
      "matchReason": "Direct competitor, local independent business with strong online presence"
    }
  ]
}

Requirements:
- Return top 12 competitors maximum
- Sort by relevanceScore descending
- Only include businesses with valid, accessible websites
- Clean URLs: remove tracking params (utm_*, fbclid, etc.), canonicalize domains
- matchReason must be one brief sentence explaining the match
- Ensure all websites are actual business sites, not directories or aggregators`,
        },
      ],
    });

    const content = completion.choices[0].message.content;
    if (!content) {
      throw new Error('No response from AI');
    }

    const result = JSON.parse(content);

    if (!result.competitors || !Array.isArray(result.competitors)) {
      throw new Error('Invalid AI response format');
    }

    // Validate and clean the results
    const validated = result.competitors
      .filter((c: any) => c.name && c.website && c.relevanceScore)
      .map((c: any) => ({
        name: c.name.trim(),
        website: cleanUrl(c.website),
        relevanceScore: Math.min(100, Math.max(0, c.relevanceScore)),
        matchReason: c.matchReason?.trim() || 'Relevant competitor',
      }))
      .slice(0, 12); // Ensure max 12

    return validated;
  } catch (error) {
    console.error('AI ranking error:', error);
    throw new Error('Failed to rank competitors with AI');
  }
}

/**
 * Clean URL by removing tracking parameters and standardizing format
 */
function cleanUrl(url: string): string {
  try {
    const parsed = new URL(url);

    // Remove common tracking parameters
    const trackingParams = [
      'utm_source',
      'utm_medium',
      'utm_campaign',
      'utm_term',
      'utm_content',
      'fbclid',
      'gclid',
      'mc_cid',
      'mc_eid',
      '_ga',
      'ref',
    ];

    trackingParams.forEach((param) => {
      parsed.searchParams.delete(param);
    });

    // Reconstruct clean URL
    let cleanUrl = `${parsed.protocol}//${parsed.hostname}`;

    if (parsed.pathname !== '/') {
      cleanUrl += parsed.pathname;
    }

    // Only add search params if any remain after cleaning
    const remainingParams = parsed.searchParams.toString();
    if (remainingParams) {
      cleanUrl += `?${remainingParams}`;
    }

    return cleanUrl;
  } catch (error) {
    // If URL parsing fails, return original
    return url;
  }
}

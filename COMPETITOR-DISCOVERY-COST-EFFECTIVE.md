# Cost-Effective Competitor Auto-Discovery
## Updated Implementation (Using Free Sources + OpenAI)

---

## 🎯 Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│ Step 1: SEED CANDIDATES (Free/Cheap)                   │
├─────────────────────────────────────────────────────────┤
│ Input: industry="Pizza Restaurant", city="Austin", state="TX"
│                                                         │
│ Heuristic Searches:                                     │
│  1. Google Custom Search: "pizza restaurant austin tx" │
│  2. Bing Search: "pizza restaurant near 78701"         │
│  3. Optional: SerpAPI (first 100 searches free)        │
│                                                         │
│ Output: ~20-30 raw URLs + business names               │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│ Step 2: AI RE-RANKER (OpenAI GPT-4o-mini)             │
├─────────────────────────────────────────────────────────┤
│ Filters:                                                │
│  ✓ Real business websites (not directories)            │
│  ✓ Relevant to industry                                │
│  ✓ Has online presence                                 │
│  ✓ Not national chains (unless relevant)               │
│                                                         │
│ Ranks by:                                               │
│  • Category match score                                │
│  • Domain quality signals                              │
│  • Business name similarity                            │
│                                                         │
│ Output: Top 10-20 ranked candidates                    │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│ Step 3: URL RESOLUTION & DEDUPLICATION                 │
├─────────────────────────────────────────────────────────┤
│ Operations:                                             │
│  • Canonicalize URLs (www vs non-www)                  │
│  • Remove duplicates (same domain)                     │
│  • Extract clean business name                         │
│  • Validate URL reachability (optional)                │
│                                                         │
│ Output: Final 10-12 unique competitors                 │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│ Step 4: CACHING (Redis/Postgres)                       │
├─────────────────────────────────────────────────────────┤
│ Cache Key: hash(industry + city + state)               │
│ TTL: 30 days                                            │
│ Expected Hit Rate: 60%+                                 │
│                                                         │
│ Result: Most discoveries are FREE (from cache)         │
└─────────────────────────────────────────────────────────┘
```

---

## 💰 Cost Breakdown (Ultra Low-Cost)

### Per Discovery Session

| Component | Provider | Cost | Notes |
|-----------|----------|------|-------|
| **Search Queries** | Google Custom Search | $0.00 - $0.005 | 100 free/day, then $5/1000 |
| **AI Ranking** | OpenAI GPT-4o-mini | $0.0002 | 500 input + 200 output tokens |
| **URL Resolution** | Self-hosted | $0.00 | Simple string operations |
| **Caching** | Redis/Postgres | $0.00 | Included in infrastructure |
| **TOTAL** | | **$0.0002 - $0.005** | Average: **$0.001** |

### Monthly Cost Projections

**Scenario: 1,000 new users/month, 80% adoption**

| Users | Cache Hit Rate | Fresh Discoveries | Cost |
|-------|----------------|-------------------|------|
| 800 | 0% (month 1) | 800 | $0.80 - $4.00 |
| 800 | 40% (month 2) | 480 | $0.48 - $2.40 |
| 800 | 60% (month 3+) | 320 | $0.32 - $1.60 |

**Average Monthly Cost: $1-2** (vs. $160 with Google Places API)

**Cost Savings: 99%** 🎉

---

## 🔧 Implementation Details

### Step 1: Seed Candidates (Free Sources)

#### Option A: Google Custom Search API (Recommended)

```typescript
// lib/discovery/search.ts
import axios from 'axios';

interface SearchResult {
  title: string;
  link: string;
  snippet: string;
  displayLink: string;
}

export async function searchGoogleCustom(
  industry: string,
  city: string,
  state: string,
  zipcode?: string
): Promise<SearchResult[]> {
  const queries = [
    `${industry} in ${city}, ${state}`,
    zipcode ? `${industry} near ${zipcode}` : null,
    `best ${industry} ${city}`,
  ].filter(Boolean);

  const allResults: SearchResult[] = [];

  for (const query of queries) {
    const response = await axios.get(
      'https://www.googleapis.com/customsearch/v1',
      {
        params: {
          key: process.env.GOOGLE_SEARCH_API_KEY,
          cx: process.env.GOOGLE_SEARCH_ENGINE_ID, // Custom Search Engine ID
          q: query,
          num: 10, // Results per query
        },
      }
    );

    allResults.push(...response.data.items);
  }

  // Remove duplicates by domain
  const unique = Array.from(
    new Map(
      allResults.map((r) => [new URL(r.link).hostname, r])
    ).values()
  );

  return unique;
}
```

**Setup Google Custom Search:**
1. Go to: https://programmablesearchengine.google.com/
2. Create a new search engine
3. Enable "Search the entire web"
4. Get your Custom Search Engine ID (cx)
5. Get API key from Google Cloud Console

**Free Tier:** 100 queries/day (3,000/month)
**Paid:** $5 per 1,000 queries

---

#### Option B: Bing Search API (Alternative)

```typescript
// lib/discovery/search-bing.ts
export async function searchBing(
  industry: string,
  city: string,
  state: string
): Promise<SearchResult[]> {
  const query = `${industry} in ${city}, ${state}`;

  const response = await axios.get(
    'https://api.bing.microsoft.com/v7.0/search',
    {
      params: {
        q: query,
        count: 20,
        mkt: 'en-US',
      },
      headers: {
        'Ocp-Apim-Subscription-Key': process.env.BING_SEARCH_API_KEY,
      },
    }
  );

  return response.data.webPages.value.map((r: any) => ({
    title: r.name,
    link: r.url,
    snippet: r.snippet,
    displayLink: new URL(r.url).hostname,
  }));
}
```

**Pricing:** $3/1000 transactions (cheaper than Google)

---

#### Option C: SerpAPI (Best Data Quality)

```typescript
// lib/discovery/search-serp.ts
import { getJson } from 'serpapi';

export async function searchSerpAPI(
  industry: string,
  city: string,
  state: string
): Promise<SearchResult[]> {
  const results = await getJson({
    engine: 'google',
    q: `${industry} in ${city}, ${state}`,
    location: `${city}, ${state}, United States`,
    api_key: process.env.SERPAPI_KEY,
    num: 20,
  });

  return results.organic_results.map((r: any) => ({
    title: r.title,
    link: r.link,
    snippet: r.snippet,
    displayLink: r.displayed_link,
  }));
}
```

**Pricing:** 100 searches free, then $50/month for 5,000 searches

---

### Step 2: AI Re-Ranker (OpenAI)

```typescript
// lib/discovery/ai-ranker.ts
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface RankedCompetitor {
  name: string;
  website: string;
  relevanceScore: number;
  matchReason: string;
}

export async function rankWithAI(
  searchResults: SearchResult[],
  industry: string,
  location: string
): Promise<RankedCompetitor[]> {
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    response_format: { type: 'json_object' },
    temperature: 0.3, // More deterministic
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
   - Directories (Yelp, TripAdvisor, Yellow Pages, Google Maps)
   - Marketplaces (Uber Eats, DoorDash, Grubhub)
   - National aggregators
   - Social media profiles (unless no website exists)
   - News articles, blogs, reviews sites
   - Businesses from wrong categories

2. KEEP (and rank):
   - Independent local businesses
   - Direct competitors in same industry
   - Businesses with official websites
   - Active, operational businesses

3. RANK by relevance (1-100):
   - Category match: Exact > Similar > Related
   - Website quality: Official site > Landing page > Social only
   - Business type: Independent > Chain > Franchise
   - Location: Local > Regional > National

4. Return JSON:
{
  "competitors": [
    {
      "name": "Business Name",
      "website": "https://cleanurl.com",
      "relevanceScore": 95,
      "matchReason": "Direct competitor, local independent business"
    }
  ]
}

Requirements:
- Return top 12 competitors max
- Sort by relevanceScore descending
- Only include businesses with valid websites
- Clean URLs (remove tracking params, canonicalize)
- Brief matchReason (one sentence)`,
      },
    ],
  });

  const result = JSON.parse(completion.choices[0].message.content);
  return result.competitors || [];
}
```

---

### Step 3: URL Resolution & Deduplication

```typescript
// lib/discovery/url-resolver.ts
export function resolveAndDedupe(
  competitors: RankedCompetitor[]
): RankedCompetitor[] {
  const seen = new Set<string>();
  const resolved: RankedCompetitor[] = [];

  for (const comp of competitors) {
    try {
      // Parse and canonicalize URL
      const url = new URL(comp.website);

      // Remove www, standardize protocol
      const canonical = url.hostname
        .replace(/^www\./, '')
        .toLowerCase();

      // Skip duplicates
      if (seen.has(canonical)) continue;
      seen.add(canonical);

      // Clean URL (remove params)
      const cleanUrl = `${url.protocol}//${url.hostname}${url.pathname}`;

      resolved.push({
        ...comp,
        website: cleanUrl,
      });
    } catch (error) {
      // Invalid URL, skip
      console.warn(`Invalid URL: ${comp.website}`);
    }
  }

  return resolved;
}

// Optional: Validate URL reachability
export async function validateUrls(
  competitors: RankedCompetitor[]
): Promise<RankedCompetitor[]> {
  const validated: RankedCompetitor[] = [];

  for (const comp of competitors) {
    try {
      const response = await fetch(comp.website, {
        method: 'HEAD',
        timeout: 5000,
      });

      if (response.ok) {
        validated.push(comp);
      }
    } catch (error) {
      // URL not reachable, skip
      console.warn(`URL not reachable: ${comp.website}`);
    }
  }

  return validated;
}
```

---

### Step 4: Caching Layer

```typescript
// lib/discovery/cache.ts
import { redis } from '@/lib/redis';
import crypto from 'crypto';

interface CachedDiscovery {
  competitors: RankedCompetitor[];
  cachedAt: string;
  expiresAt: string;
}

// Generate cache key
function getCacheKey(industry: string, city: string, state: string): string {
  const normalized = `${industry}|${city}|${state}`
    .toLowerCase()
    .trim();
  return crypto
    .createHash('md5')
    .update(normalized)
    .digest('hex');
}

// Get from cache
export async function getCached(
  industry: string,
  city: string,
  state: string
): Promise<RankedCompetitor[] | null> {
  const key = getCacheKey(industry, city, state);
  const cached = await redis.get(`discovery:${key}`);

  if (!cached) return null;

  const data: CachedDiscovery = JSON.parse(cached);

  // Check if expired
  if (new Date(data.expiresAt) < new Date()) {
    await redis.del(`discovery:${key}`);
    return null;
  }

  return data.competitors;
}

// Save to cache
export async function saveToCache(
  industry: string,
  city: string,
  state: string,
  competitors: RankedCompetitor[]
): Promise<void> {
  const key = getCacheKey(industry, city, state);

  const data: CachedDiscovery = {
    competitors,
    cachedAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
  };

  await redis.set(
    `discovery:${key}`,
    JSON.stringify(data),
    'EX',
    30 * 24 * 60 * 60 // 30 days in seconds
  );
}
```

---

### Complete API Endpoint

```typescript
// app/api/competitors/discover/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { searchGoogleCustom } from '@/lib/discovery/search';
import { rankWithAI } from '@/lib/discovery/ai-ranker';
import { resolveAndDedupe } from '@/lib/discovery/url-resolver';
import { getCached, saveToCache } from '@/lib/discovery/cache';

interface DiscoverRequest {
  industry: string;
  city: string;
  state: string;
  zipcode?: string;
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { industry, city, state, zipcode }: DiscoverRequest = await req.json();

  // Validation
  if (!industry || !city || !state) {
    return NextResponse.json(
      { error: 'Industry, city, and state are required' },
      { status: 400 }
    );
  }

  try {
    // Step 0: Check cache
    const cached = await getCached(industry, city, state);
    if (cached) {
      return NextResponse.json({
        competitors: cached,
        cached: true,
        count: cached.length,
      });
    }

    // Step 1: Seed candidates (free search)
    console.log('🔍 Searching for candidates...');
    const searchResults = await searchGoogleCustom(
      industry,
      city,
      state,
      zipcode
    );

    if (searchResults.length === 0) {
      return NextResponse.json({
        competitors: [],
        cached: false,
        count: 0,
        message: 'No competitors found in this area',
      });
    }

    // Step 2: AI re-ranker
    console.log('🤖 Ranking with AI...');
    const ranked = await rankWithAI(
      searchResults,
      industry,
      `${city}, ${state}`
    );

    // Step 3: URL resolution & deduplication
    console.log('🔗 Resolving URLs...');
    const resolved = resolveAndDedupe(ranked);

    // Step 4: Cache results
    await saveToCache(industry, city, state, resolved);

    // Track analytics
    await trackDiscovery(session.user.id, industry, city, state, resolved.length);

    return NextResponse.json({
      competitors: resolved,
      cached: false,
      count: resolved.length,
    });
  } catch (error) {
    console.error('Discovery error:', error);
    return NextResponse.json(
      { error: 'Failed to discover competitors' },
      { status: 500 }
    );
  }
}

// Analytics tracking
async function trackDiscovery(
  userId: string,
  industry: string,
  city: string,
  state: string,
  resultCount: number
) {
  // Optional: Track in database for analytics
  await prisma.discoveryEvent.create({
    data: {
      userId: parseInt(userId),
      industry,
      city,
      state,
      resultCount,
      createdAt: new Date(),
    },
  });
}
```

---

## 📊 Cost Comparison: Final

| Approach | Setup | Per Discovery | Monthly (800 users, 60% cache) |
|----------|-------|---------------|-------------------------------|
| **Your Approach** ⭐ | Free | $0.001 | **$0.32** |
| My Original (Google Places) | $0 | $0.20 | $96.00 |
| **Savings** | | **99.5%** | **$95.68/month** |

---

## ✅ Advantages of Your Approach

1. **Ultra Low Cost:** $0.32/month vs. $96/month
2. **No API Dependencies:** Not locked into Google Places
3. **Better Caching:** (industry + location) hash is perfect
4. **Scalable:** Can handle 10K users for <$10/month
5. **Flexible:** Easy to add more data sources
6. **Smart:** AI only where needed (ranking, not crawling)

---

## ⚠️ Considerations

### Potential Challenges:

1. **Data Quality**
   - Search results may include irrelevant links
   - Mitigation: Strong AI filtering prompt

2. **Search API Limits**
   - Google Custom Search: 100 free/day
   - Mitigation: Use multiple providers, caching

3. **URL Validation**
   - Some URLs may be broken
   - Mitigation: Optional HEAD request validation

4. **Legal/ToS**
   - Search APIs have usage limits
   - Mitigation: Use official APIs (Google Custom Search, Bing)

---

## 🚀 Recommended Stack

```
Data Sources (pick 1-2):
├─ Google Custom Search API ⭐ (best quality)
├─ Bing Search API (cheaper)
└─ SerpAPI (premium, best structured data)

AI Layer:
└─ OpenAI GPT-4o-mini ⭐ (cheapest, great quality)

Caching:
└─ Redis or Postgres

URL Processing:
└─ Node.js built-in (free)
```

---

## 📈 Expected Performance

| Metric | Target | Notes |
|--------|--------|-------|
| Discovery time | <10 sec | Parallel searches + fast AI |
| Accuracy | 80%+ | User keeps most suggestions |
| Cache hit rate | 60%+ | After month 2 |
| Cost per discovery | <$0.01 | 99% cheaper than Google Places |
| API success rate | >99% | Multiple fallbacks |

---

## 🎯 Implementation Timeline

### Week 1: Foundation
- [ ] Set up Google Custom Search API (free tier)
- [ ] Implement search function
- [ ] Set up OpenAI API
- [ ] Create AI ranking function

### Week 2: Integration
- [ ] Build URL resolution logic
- [ ] Implement caching layer (Redis)
- [ ] Create API endpoint
- [ ] Add error handling

### Week 3: UI
- [ ] Build discovery component
- [ ] Integrate into onboarding
- [ ] Add loading states
- [ ] Manual add fallback

### Week 4: Polish
- [ ] Test across 20 industries
- [ ] Optimize prompts
- [ ] Add analytics tracking
- [ ] Performance tuning

**Total: 4 weeks, same as original plan, but 99% cheaper!**

---

## 💡 Future Enhancements

1. **Multi-Source Fusion**
   - Combine Google + Bing results
   - Weight by source reliability

2. **Machine Learning Ranker**
   - Train model on user selections
   - Improve ranking over time

3. **Pre-computed Database**
   - Cache popular (industry + location) pairs
   - Instant results for common searches

4. **Real-time Updates**
   - Refresh cache every 30 days
   - Notify users of new competitors

---

## ✅ Final Recommendation

**Use YOUR cost-effective approach!**

**Why:**
- ✅ 99% cost savings ($0.32 vs $96/month)
- ✅ No API lock-in
- ✅ Same user experience
- ✅ Validates feature before scaling
- ✅ Can always upgrade to Google Places later

**Start with:**
1. Google Custom Search API (free tier)
2. OpenAI GPT-4o-mini
3. Redis caching
4. Simple URL resolution

**Upgrade later if needed:**
- If quality isn't good enough → Add Google Places
- If search limits hit → Add Bing API
- If scaling → Pre-build database

---

**Your instincts were spot-on!** This is the right MVP approach. 🎯

Let me know if you want me to implement this version!

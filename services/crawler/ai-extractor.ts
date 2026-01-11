import Anthropic from '@anthropic-ai/sdk';
import { db } from '@/lib/db/prisma';
import { hashContent, normalizeContent } from '@/lib/utils/hash';

export interface ExtractedData {
  prices: Array<{
    item: string;
    price: string;
    currency?: string;
    category?: string;
  }>;
  promotions: Array<{
    title: string;
    description: string;
    discount?: string;
    validUntil?: string;
  }>;
  menu_items: Array<{
    name: string;
    category?: string;
    price?: string;
    description?: string;
  }>;
  raw_text?: string;
}

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const EXTRACTION_PROMPT = `You are an expert at extracting structured data from website HTML content.

Extract and return ONLY valid JSON (no markdown, no explanation) with the following structure:
{
  "prices": [{"item": "...", "price": "...", "currency": "USD", "category": "..."}],
  "promotions": [{"title": "...", "description": "...", "discount": "...", "validUntil": "..."}],
  "menu_items": [{"name": "...", "category": "...", "price": "...", "description": "..."}]
}

Rules:
1. Extract ALL prices, promotions, and menu items visible on the page
2. Keep prices exactly as shown (including currency symbols)
3. For promotions, extract discount percentages or descriptions
4. For menu items, extract name, category, price, and description if available
5. If a section is empty, use an empty array
6. Return ONLY the JSON object, nothing else
7. Do not include null values

HTML Content to Extract From:
`;

/**
 * Check extraction cache by hash
 */
async function getFromCache(contentHash: string): Promise<ExtractedData | null> {
  try {
    const cached = await db.extractionCache.findUnique({
      where: { contentHash },
    });

    if (cached) {
      console.log(`Cache hit for hash: ${contentHash}`);
      return cached.extractedData as unknown as ExtractedData;
    }
  } catch (error) {
    console.error('Cache lookup failed:', error);
  }

  return null;
}

/**
 * Save extraction to cache
 */
async function saveToCache(contentHash: string, data: ExtractedData): Promise<void> {
  try {
    await db.extractionCache.upsert({
      where: { contentHash },
      update: { extractedData: data as any },
      create: {
        contentHash,
        extractedData: data as any,
      },
    });
    console.log(`Cached extraction for hash: ${contentHash}`);
  } catch (error) {
    console.error('Cache save failed:', error);
    // Don't throw - caching failure shouldn't block extraction
  }
}

/**
 * Fallback extraction using regex (when Claude API fails)
 */
function fallbackExtraction(text: string): ExtractedData {
  console.log('Using fallback extraction (regex)');

  const priceRegex = /\$\d+\.?\d{0,2}|EUR\s*\d+\.?\d{0,2}/gi;
  const prices = text.match(priceRegex) || [];

  const promotionRegex = /(off|discount|sale|free|save|coupon)[:\s]*([^.\n]{10,100})/gi;
  const promotions = text.match(promotionRegex) || [];

  return {
    prices: prices.map((p) => ({ item: 'unknown', price: p })),
    promotions: promotions.map((p) => ({ title: 'Promotion', description: p })),
    menu_items: [],
  };
}

/**
 * Extract structured data from HTML using Claude
 */
export async function extractData(html: string): Promise<ExtractedData> {
  // Compute hashes for caching
  const contentHash = hashContent(html);
  const normalizedHash = hashContent(normalizeContent(html));

  // Check cache with both hashes
  let cached = await getFromCache(contentHash);
  if (cached) return cached;

  cached = await getFromCache(normalizedHash);
  if (cached) {
    // Update cache with both hashes for future lookups
    await saveToCache(contentHash, cached);
    return cached;
  }

  try {
    // Truncate HTML to avoid token limits
    const truncatedHtml = html.length > 30000 ? html.substring(0, 30000) : html;

    // Call Claude Haiku for extraction
    console.log('Calling Claude Haiku for extraction...');
    const response = await client.messages.create({
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 2000,
      messages: [
        {
          role: 'user',
          content: EXTRACTION_PROMPT + truncatedHtml,
        },
      ],
    });

    // Extract JSON from response
    const responseText = response.content[0]?.type === 'text' ? response.content[0].text : '';

    if (!responseText) {
      throw new Error('Empty response from Claude');
    }

    // Parse JSON (Claude should return valid JSON)
    let extracted: ExtractedData;
    try {
      extracted = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Failed to parse Claude response:', responseText.substring(0, 200));
      throw new Error('Claude returned invalid JSON');
    }

    // Validate structure
    if (!extracted.prices) extracted.prices = [];
    if (!extracted.promotions) extracted.promotions = [];
    if (!extracted.menu_items) extracted.menu_items = [];

    // Cache the extraction
    await saveToCache(contentHash, extracted);
    await saveToCache(normalizedHash, extracted);

    console.log(`Extracted: ${extracted.prices.length} prices, ${extracted.promotions.length} promotions, ${extracted.menu_items.length} menu items`);
    return extracted;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Claude extraction failed:', errorMessage);

    // Fallback to regex-based extraction
    const textContent = html;
    return fallbackExtraction(textContent);
  }
}

/**
 * Get extraction stats for monitoring
 */
export async function getExtractionStats(): Promise<{
  cached: number;
  total: number;
  cacheSize: number;
}> {
  try {
    const count = await db.extractionCache.count();
    return {
      cached: count,
      total: count,
      cacheSize: count, // Rough estimate
    };
  } catch (error) {
    console.error('Failed to get extraction stats:', error);
    return { cached: 0, total: 0, cacheSize: 0 };
  }
}

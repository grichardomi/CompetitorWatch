/**
 * AI-Powered Industry Detection Service
 * Automatically detects competitor industry from URL and content
 */

import OpenAI from 'openai';
import { Industry, INDUSTRIES, INDUSTRY_METADATA } from '@/lib/config/industries';

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface IndustryDetectionResult {
  industry: Industry;
  confidence: number; // 0.0 - 1.0
  reasoning: string;
  matchesBusinessIndustry: boolean;
  warning?: string;
}

/**
 * Quick URL-based industry hint (before full crawl)
 * Uses pattern matching for instant feedback
 */
export function getIndustryHintFromUrl(url: string): Industry | null {
  const lowerUrl = url.toLowerCase();

  // Restaurant & Food patterns
  if (
    lowerUrl.includes('restaurant') ||
    lowerUrl.includes('menu') ||
    lowerUrl.includes('food') ||
    lowerUrl.includes('pizza') ||
    lowerUrl.includes('burger') ||
    lowerUrl.includes('cafe') ||
    lowerUrl.includes('dining') ||
    lowerUrl.includes('delivery') ||
    lowerUrl.includes('eats') ||
    lowerUrl.includes('kitchen') ||
    lowerUrl.match(/\b(doordash|ubereats|grubhub|postmates|domino|chipotle|subway|mcdon|wendys|tacobell)\b/)
  ) {
    return INDUSTRIES.RESTAURANT_FOOD;
  }

  // Retail & E-commerce patterns
  if (
    lowerUrl.includes('shop') ||
    lowerUrl.includes('store') ||
    lowerUrl.includes('buy') ||
    lowerUrl.includes('cart') ||
    lowerUrl.includes('retail') ||
    lowerUrl.includes('market') ||
    lowerUrl.match(/\b(amazon|ebay|etsy|walmart|target)\b/)
  ) {
    return INDUSTRIES.RETAIL_ECOMMERCE;
  }

  // Healthcare & Pharmacy patterns
  if (
    lowerUrl.includes('health') ||
    lowerUrl.includes('medical') ||
    lowerUrl.includes('pharmacy') ||
    lowerUrl.includes('clinic') ||
    lowerUrl.includes('doctor') ||
    lowerUrl.includes('hospital') ||
    lowerUrl.match(/\b(cvs|walgreens|rite)\b/)
  ) {
    return INDUSTRIES.HEALTHCARE_PHARMACY;
  }

  // Professional Services patterns
  if (
    lowerUrl.includes('consulting') ||
    lowerUrl.includes('law') ||
    lowerUrl.includes('legal') ||
    lowerUrl.includes('accounting') ||
    lowerUrl.includes('attorney') ||
    lowerUrl.includes('cpa') ||
    lowerUrl.includes('advisory')
  ) {
    return INDUSTRIES.PROFESSIONAL_SERVICES;
  }

  return null;
}

/**
 * AI-powered industry detection from URL and optional HTML content
 * Uses GPT-4o-mini for intelligent classification
 */
export async function detectCompetitorIndustry(
  url: string,
  html?: string,
  businessIndustry?: Industry
): Promise<IndustryDetectionResult> {
  // First try quick URL hint
  const urlHint = getIndustryHintFromUrl(url);

  // If we have a URL hint and it matches business industry, use it with high confidence
  if (urlHint && businessIndustry && urlHint === businessIndustry) {
    return {
      industry: urlHint,
      confidence: 0.85,
      reasoning: 'URL patterns match your business industry',
      matchesBusinessIndustry: true,
    };
  }

  try {
    // Build industry options for prompt
    const industries = Object.values(INDUSTRIES)
      .map((ind) => `- ${ind}: ${INDUSTRY_METADATA[ind].description}`)
      .join('\n');

    // Build prompt
    const contentPreview = html ? html.substring(0, 3000) : '';
    const hasContent = !!html;

    const prompt = `Analyze this website and determine its industry category.

URL: ${url}
${hasContent ? `\nWebsite Content Preview:\n${contentPreview}` : ''}

Available Industries:
${industries}

Based on the URL${hasContent ? ' and content' : ''}, determine which industry this website belongs to.

Return ONLY a valid JSON object (no markdown, no explanation) with this exact structure:
{
  "industry": "exact_industry_key_from_list",
  "confidence": 0.95,
  "reasoning": "brief explanation (max 100 chars)"
}

Rules:
- Use exact industry keys from the list above
- Confidence should be 0.0 to 1.0
- Be conservative with confidence if unsure
- Reasoning should be concise and specific`;

    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.1, // Low temperature for consistent results
      max_tokens: 150,
      messages: [
        {
          role: 'system',
          content:
            'You are an expert at classifying businesses into industry categories. Return only valid JSON.',
        },
        { role: 'user', content: prompt },
      ],
    });

    const content = response.choices[0]?.message?.content || '';

    // Clean markdown code blocks if present
    const cleaned = content
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();

    const result = JSON.parse(cleaned);

    // Validate industry
    const detectedIndustry = result.industry as Industry;
    if (!Object.values(INDUSTRIES).includes(detectedIndustry)) {
      throw new Error(`Invalid industry detected: ${detectedIndustry}`);
    }

    // Validate confidence
    let confidence = parseFloat(result.confidence);
    if (isNaN(confidence) || confidence < 0 || confidence > 1) {
      console.warn(`Invalid confidence: ${result.confidence}, defaulting to 0.5`);
      confidence = 0.5;
    }

    // Check if matches business industry
    const matches = businessIndustry ? businessIndustry === detectedIndustry : false;
    let warning: string | undefined;

    if (businessIndustry && !matches) {
      warning =
        `This competitor appears to be in ${INDUSTRY_METADATA[detectedIndustry].label}, ` +
        `but your business is in ${INDUSTRY_METADATA[businessIndustry].label}. ` +
        `Cross-industry monitoring may yield less relevant insights.`;
    }

    console.log(
      `Industry detected: ${detectedIndustry} (${confidence}) - ${result.reasoning}`
    );

    return {
      industry: detectedIndustry,
      confidence,
      reasoning: result.reasoning || 'AI classification',
      matchesBusinessIndustry: matches,
      warning,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Industry detection failed:', errorMessage);

    // Fallback 1: Use URL hint if available
    if (urlHint) {
      const matches = businessIndustry ? businessIndustry === urlHint : false;
      let warning: string | undefined;

      if (businessIndustry && !matches) {
        warning =
          `URL suggests ${INDUSTRY_METADATA[urlHint].label}, ` +
          `but your business is in ${INDUSTRY_METADATA[businessIndustry].label}. ` +
          `AI detection failed - using URL pattern matching.`;
      }

      return {
        industry: urlHint,
        confidence: 0.65,
        reasoning: 'URL pattern matching (AI detection failed)',
        matchesBusinessIndustry: matches,
        warning,
      };
    }

    // Fallback 2: Use business industry if available
    if (businessIndustry) {
      return {
        industry: businessIndustry,
        confidence: 0.5,
        reasoning: 'Using your business industry (detection unavailable)',
        matchesBusinessIndustry: true,
      };
    }

    // Ultimate fallback: Default to restaurant
    console.warn('All detection methods failed, using default industry');
    return {
      industry: INDUSTRIES.RESTAURANT_FOOD,
      confidence: 0.3,
      reasoning: 'Default industry (detection unavailable)',
      matchesBusinessIndustry: false,
      warning: 'Could not detect industry automatically. Please verify manually.',
    };
  }
}

/**
 * Get the effective industry for a competitor
 * Priority: manual override > detected industry > business industry
 */
export function getEffectiveIndustry(
  competitor: {
    industry?: string | null;
    detectedIndustry?: string | null;
  },
  businessIndustry: string
): Industry {
  // 1. Use manual override if set
  if (competitor.industry && Object.values(INDUSTRIES).includes(competitor.industry as Industry)) {
    return competitor.industry as Industry;
  }

  // 2. Use detected industry if available
  if (
    competitor.detectedIndustry &&
    Object.values(INDUSTRIES).includes(competitor.detectedIndustry as Industry)
  ) {
    return competitor.detectedIndustry as Industry;
  }

  // 3. Fallback to business industry
  if (Object.values(INDUSTRIES).includes(businessIndustry as Industry)) {
    return businessIndustry as Industry;
  }

  // 4. Ultimate fallback
  return INDUSTRIES.RESTAURANT_FOOD;
}

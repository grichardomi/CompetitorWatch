/**
 * Industry configuration for MarketPulse
 * Defines supported industries and their characteristics
 */

export const INDUSTRIES = {
  RESTAURANT_FOOD: 'restaurant_food',
  RETAIL_ECOMMERCE: 'retail_ecommerce',
  HEALTHCARE_PHARMACY: 'healthcare_pharmacy',
  PROFESSIONAL_SERVICES: 'professional_services',
} as const;

export type Industry = (typeof INDUSTRIES)[keyof typeof INDUSTRIES];

export const INDUSTRY_METADATA: Record<
  Industry,
  {
    label: string;
    description: string;
    publishablePrices: boolean;
    blockCreationMessage?: string;
  }
> = {
  [INDUSTRIES.RESTAURANT_FOOD]: {
    label: 'Restaurant & Food Service',
    description: 'Restaurants, cafes, catering, and food delivery services',
    publishablePrices: true,
  },
  [INDUSTRIES.RETAIL_ECOMMERCE]: {
    label: 'Retail & E-commerce',
    description: 'Online stores, retail shops, and e-commerce businesses',
    publishablePrices: true,
  },
  [INDUSTRIES.HEALTHCARE_PHARMACY]: {
    label: 'Healthcare & Pharmacy',
    description: 'Healthcare providers, pharmacies, and medical services',
    publishablePrices: false,
    blockCreationMessage:
      'Healthcare and pharmacy pricing information may be subject to privacy regulations. Please ensure compliance with HIPAA and local regulations before monitoring competitor prices in this industry.',
  },
  [INDUSTRIES.PROFESSIONAL_SERVICES]: {
    label: 'Professional Services',
    description: 'Consulting, legal, accounting, and professional service firms',
    publishablePrices: true,
  },
};

export const DEFAULT_INDUSTRY: Industry = INDUSTRIES.RESTAURANT_FOOD;

/**
 * Get list of industries for dropdowns
 */
export function getIndustryOptions(): Array<{
  value: Industry;
  label: string;
  description: string;
}> {
  return Object.values(INDUSTRIES).map((value) => ({
    value,
    label: INDUSTRY_METADATA[value].label,
    description: INDUSTRY_METADATA[value].description,
  }));
}

/**
 * Check if an industry allows publishable prices
 */
export function canPublishPrices(industry: Industry): boolean {
  return INDUSTRY_METADATA[industry].publishablePrices;
}

/**
 * Get validation message for non-publishable industry
 */
export function getIndustryValidationMessage(industry: Industry): string | null {
  if (canPublishPrices(industry)) {
    return null;
  }
  return (
    INDUSTRY_METADATA[industry].blockCreationMessage ||
    'This industry does not support price monitoring.'
  );
}

/**
 * AI Extraction prompts per industry
 */
export const INDUSTRY_EXTRACTION_PROMPTS: Record<Industry, string> = {
  [INDUSTRIES.RESTAURANT_FOOD]: `You are an expert at extracting structured data from restaurant and food service websites.

Extract and return ONLY valid JSON (no markdown, no explanation) with the following structure:
{
  "prices": [{"item": "...", "price": "...", "currency": "USD", "category": "..."}],
  "promotions": [{"title": "...", "description": "...", "discount": "...", "validUntil": "..."}],
  "menu_items": [{"name": "...", "category": "...", "price": "...", "description": "..."}]
}

Rules:
1. Extract ALL menu items, prices, and promotions visible on the page
2. Keep prices exactly as shown (including currency symbols)
3. For promotions, extract discount percentages, descriptions, and validity dates
4. For menu items, extract name, category (appetizers, entrees, desserts, etc.), price, and description
5. If a section is empty, use an empty array
6. Return ONLY the JSON object, nothing else
7. Do not include null values

HTML Content to Extract From:
`,

  [INDUSTRIES.RETAIL_ECOMMERCE]: `You are an expert at extracting structured data from retail and e-commerce websites.

Extract and return ONLY valid JSON (no markdown, no explanation) with the following structure:
{
  "prices": [{"item": "...", "price": "...", "currency": "USD", "category": "..."}],
  "promotions": [{"title": "...", "description": "...", "discount": "...", "validUntil": "..."}],
  "menu_items": [{"name": "...", "category": "...", "price": "...", "description": "..."}]
}

Rules:
1. Extract ALL product prices, sale prices, and promotional offers visible on the page
2. Keep prices exactly as shown (including currency symbols and strike-through original prices)
3. For promotions, extract discount codes, percentage off, BOGO deals, and validity dates
4. For products, extract name, category, current price, original price (if on sale), and brief description
5. If a section is empty, use an empty array
6. Return ONLY the JSON object, nothing else
7. Do not include null values

HTML Content to Extract From:
`,

  [INDUSTRIES.HEALTHCARE_PHARMACY]: `You are an expert at extracting structured data from healthcare and pharmacy websites.

Extract and return ONLY valid JSON (no markdown, no explanation) with the following structure:
{
  "prices": [{"item": "...", "price": "...", "currency": "USD", "category": "..."}],
  "promotions": [{"title": "...", "description": "...", "discount": "...", "validUntil": "..."}],
  "menu_items": [{"name": "...", "category": "...", "price": "...", "description": "..."}]
}

Rules:
1. Extract service prices, consultation fees, and publicly available pricing information ONLY
2. DO NOT extract personal health information (PHI) or patient-specific data
3. Keep prices exactly as shown (including currency symbols)
4. For promotions, extract health packages, wellness program discounts, and validity dates
5. For services, extract name, category (consultation, lab tests, procedures, etc.), price, and description
6. If a section is empty, use an empty array
7. Return ONLY the JSON object, nothing else
8. Do not include null values
9. Respect privacy regulations (HIPAA compliance)

HTML Content to Extract From:
`,

  [INDUSTRIES.PROFESSIONAL_SERVICES]: `You are an expert at extracting structured data from professional services websites.

Extract and return ONLY valid JSON (no markdown, no explanation) with the following structure:
{
  "prices": [{"item": "...", "price": "...", "currency": "USD", "category": "..."}],
  "promotions": [{"title": "...", "description": "...", "discount": "...", "validUntil": "..."}],
  "menu_items": [{"name": "...", "category": "...", "price": "...", "description": "..."}]
}

Rules:
1. Extract ALL service packages, hourly rates, and consultation fees visible on the page
2. Keep prices exactly as shown (including currency symbols and rate structures like "per hour")
3. For promotions, extract introductory offers, package discounts, and validity dates
4. For services, extract name, category (consulting, legal, accounting, etc.), pricing structure, and description
5. If a section is empty, use an empty array
6. Return ONLY the JSON object, nothing else
7. Do not include null values

HTML Content to Extract From:
`,
};

/**
 * Get AI extraction prompt for a specific industry
 */
export function getExtractionPrompt(industry?: Industry | null): string {
  if (!industry || !INDUSTRY_EXTRACTION_PROMPTS[industry]) {
    // Fallback to restaurant/food as default
    return INDUSTRY_EXTRACTION_PROMPTS[INDUSTRIES.RESTAURANT_FOOD];
  }
  return INDUSTRY_EXTRACTION_PROMPTS[industry];
}

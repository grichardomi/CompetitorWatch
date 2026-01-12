import { db } from '@/lib/db/prisma';
import {
  canPublishPrices,
  getIndustryValidationMessage,
  type Industry,
} from '@/lib/config/industries';

export interface IndustryValidationResult {
  allowed: boolean;
  error?: string;
  warning?: string;
}

/**
 * Validate if a business's industry allows competitor creation
 * Used when creating competitors to block non-publishable industries
 */
export async function validateIndustryForCompetitor(
  businessId: number
): Promise<IndustryValidationResult> {
  try {
    const business = await db.business.findUnique({
      where: { id: businessId },
      select: { industry: true },
    });

    if (!business) {
      return {
        allowed: false,
        error: 'Business not found',
      };
    }

    const industry = business.industry as Industry;

    if (!canPublishPrices(industry)) {
      const message = getIndustryValidationMessage(industry);
      return {
        allowed: false,
        error: message || 'This industry does not support price monitoring',
      };
    }

    return { allowed: true };
  } catch (error) {
    console.error('Industry validation error:', error);
    return {
      allowed: false,
      error: 'Failed to validate industry',
    };
  }
}

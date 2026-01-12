import { z } from 'zod';

/**
 * Business update schema
 *
 * NOTE: Industry is intentionally excluded - it's locked after onboarding
 * and cannot be changed via this schema
 */
export const businessUpdateSchema = z.object({
  name: z
    .string()
    .min(2, 'Business name must be at least 2 characters')
    .max(100, 'Business name must be less than 100 characters')
    .trim()
    .optional(),
  location: z
    .string()
    .max(200, 'Location must be less than 200 characters')
    .trim()
    .optional(),
});

/**
 * Validate that industry field is not present in update request
 */
export function hasIndustryField(data: any): boolean {
  return 'industry' in data;
}

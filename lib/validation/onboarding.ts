import { z } from 'zod';
import { INDUSTRIES } from '@/lib/config/industries';

// Define valid industries as Zod enum
const validIndustries = Object.values(INDUSTRIES);

export const businessSchema = z.object({
  name: z.string()
    .min(2, 'Business name must be at least 2 characters')
    .max(100, 'Business name cannot exceed 100 characters'),
  location: z.string()
    .max(200, 'Location cannot exceed 200 characters')
    .optional()
    .default(''),
  industry: z
    .enum(validIndustries as [string, ...string[]])
    .default('restaurant_food'),
});

export const competitorSchema = z.object({
  name: z.string()
    .min(2, 'Competitor name must be at least 2 characters')
    .max(100, 'Competitor name cannot exceed 100 characters'),
  url: z.string()
    .url('Please enter a valid URL')
    .min(1, 'URL is required'),
});

export const preferencesSchema = z.object({
  emailEnabled: z.boolean().default(true),
  emailFrequency: z.enum(['instant', 'daily', 'weekly']).optional().default('instant'),
  alertTypes: z.array(z.string())
    .default(['price_change', 'new_promotion']),
  timezone: z.string()
    .optional()
    .default('America/New_York'),
});

export type BusinessFormData = z.infer<typeof businessSchema>;
export type CompetitorFormData = z.infer<typeof competitorSchema>;
export type PreferencesFormData = z.infer<typeof preferencesSchema>;

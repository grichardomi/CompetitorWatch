import { z } from 'zod';

export const createCompetitorSchema = z.object({
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name cannot exceed 100 characters'),
  url: z.string()
    .url('Please enter a valid URL')
    .min(1, 'URL is required'),
  crawlFrequencyMinutes: z.number()
    .min(360, 'Minimum frequency is 6 hours')
    .max(2880, 'Maximum frequency is 48 hours')
    .default(720),
  isActive: z.boolean().default(true),
});

export const updateCompetitorSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  url: z.string().url().optional(),
  crawlFrequencyMinutes: z.number().min(360).max(2880).optional(),
  isActive: z.boolean().optional(),
});

export type CreateCompetitorData = z.infer<typeof createCompetitorSchema>;
export type UpdateCompetitorData = z.infer<typeof updateCompetitorSchema>;

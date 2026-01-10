import { z } from 'zod';

// Business Validation
export const createBusinessSchema = z.object({
  name: z.string().min(1, 'Business name is required'),
  location: z.string().min(1, 'Location is required'),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  monitoringRadiusKm: z.number().default(3.0),
});

// Competitor Validation
export const createCompetitorSchema = z.object({
  businessId: z.number(),
  name: z.string().min(1, 'Competitor name is required'),
  url: z.string().url('Invalid URL format'),
  crawlFrequencyMinutes: z.number().default(720),
});

// Notification Preferences
export const notificationPreferencesSchema = z.object({
  emailEnabled: z.boolean(),
  emailFrequency: z.enum(['instant', 'hourly', 'daily', 'weekly']),
  smsEnabled: z.boolean(),
  smsPhoneNumber: z.string().optional(),
  alertTypes: z.array(z.enum(['price_change', 'new_promotion', 'menu_change'])),
  quietHoursStart: z.string().optional(),
  quietHoursEnd: z.string().optional(),
  timezone: z.string().default('America/New_York'),
});

// Webhook Validation
export const createWebhookSchema = z.object({
  businessId: z.number(),
  url: z.string().url('Invalid webhook URL'),
  events: z.array(z.enum(['price_change', 'new_promotion', 'menu_change'])),
  secret: z.string().optional(),
});

// Alert Validation
export const createAlertSchema = z.object({
  businessId: z.number(),
  competitorId: z.number().optional(),
  alertType: z.enum(['price_change', 'new_promotion', 'menu_change']),
  message: z.string().min(1),
  details: z.record(z.any()).optional(),
});

export type CreateBusinessInput = z.infer<typeof createBusinessSchema>;
export type CreateCompetitorInput = z.infer<typeof createCompetitorSchema>;
export type NotificationPreferencesInput = z.infer<typeof notificationPreferencesSchema>;
export type CreateWebhookInput = z.infer<typeof createWebhookSchema>;
export type CreateAlertInput = z.infer<typeof createAlertSchema>;

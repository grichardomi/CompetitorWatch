export type UserRole = 'user' | 'admin';

export type SubscriptionStatus = 'active' | 'canceled' | 'past_due' | 'trialing';

export type AlertType = 'price_change' | 'new_promotion' | 'menu_change';

export type EmailFrequency = 'instant' | 'hourly' | 'daily' | 'weekly';

export type WebhookStatus = 'success' | 'failed' | 'pending';

export type PaymentStatus = 'succeeded' | 'failed' | 'pending';

export interface ExtractedData {
  prices: Array<{
    name: string;
    oldPrice?: number;
    newPrice: number;
    currency: string;
  }>;
  promotions: Array<{
    title: string;
    description: string;
    expiresAt?: string;
  }>;
  menu_items: Array<{
    name: string;
    price?: number;
    description?: string;
  }>;
}

export interface PriceSnapshot {
  id: number;
  competitorId: number;
  extractedData: ExtractedData;
  snapshotHash: string;
  detectedAt: Date;
}

export interface AlertWithDetails {
  id: number;
  businessId: number;
  competitorId?: number;
  alertType: AlertType;
  message: string;
  details?: Record<string, any>;
  isRead: boolean;
  createdAt: Date;
}

export interface PricingPlan {
  id: string;
  name: string;
  price: number;
  competitorLimit: number;
  features: string[];
  stripePriceId: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface ApiErrorResponse {
  success: false;
  error: string;
  message?: string;
}

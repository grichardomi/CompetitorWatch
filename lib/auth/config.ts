import { NextAuthConfig } from 'next-auth';
import Google from 'next-auth/providers/google';
import Email from 'next-auth/providers/email';
import { db } from '@/lib/db/prisma';
import { sendEmail } from '@/lib/email/client';

if (!process.env.NEXTAUTH_SECRET) {
  throw new Error('NEXTAUTH_SECRET is not set');
}

if (!process.env.NEXTAUTH_URL) {
  throw new Error('NEXTAUTH_URL is not set');
}

/**
 * Create or get user with trial subscription and notification preferences
 */
async function createOrGetUser(email: string, name?: string, image?: string) {
  let user = await db.user.findUnique({
    where: { email },
  });

  // Create user if doesn't exist
  if (!user) {
    user = await db.user.create({
      data: {
        email,
        name: name || undefined,
        image: image || undefined,
        emailVerified: new Date(), // Email verified through magic link
      },
    });

    // Create trial subscription (14 days)
    await db.subscription.create({
      data: {
        userId: user.id,
        stripeSubscriptionId: `trial_${Date.now()}`,
        stripePriceId: 'trial',
        status: 'trialing',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        competitorLimit: 5, // Starter tier
      },
    });

    // Create notification preferences
    await db.notificationPreferences.create({
      data: {
        userId: user.id,
      },
    });
  }

  return user;
}

export const authConfig: NextAuthConfig = {
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    }),
  ],
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
};

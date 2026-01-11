import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { db } from '@/lib/db/prisma';
import { stripe } from '@/lib/stripe/config';
import { getDashboardUrl } from '@/lib/config/env';

export async function POST(req: Request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user from database
    const user = await db.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user has Stripe customer ID
    if (!user.stripeCustomerId) {
      return Response.json(
        { error: 'No Stripe customer found. Please subscribe first.' },
        { status: 404 }
      );
    }

    // Create Stripe billing portal session
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: getDashboardUrl('/dashboard/billing'),
    });

    return Response.json({
      portalUrl: portalSession.url,
    });
  } catch (error: any) {
    console.error('Failed to create portal session:', error);
    return Response.json(
      { error: error.message || 'Failed to create portal session' },
      { status: 500 }
    );
  }
}

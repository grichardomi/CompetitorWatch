import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { db } from '@/lib/db/prisma';
import { createCompetitorSchema } from '@/lib/validation/competitor';
import { normalizeUrl } from '@/lib/utils/format';

export async function GET() {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user from database
    const user = await db.user.findUnique({
      where: { email: session.user.email },
      include: {
        businesses: {
          include: {
            competitors: {
              include: {
                _count: {
                  select: {
                    alerts: { where: { isRead: false } },
                    priceSnapshots: true,
                  },
                },
              },
              orderBy: { createdAt: 'desc' },
            },
          },
        },
      },
    });

    if (!user) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    const competitors = user.businesses[0]?.competitors || [];

    // Get user's subscription
    const subscription = await db.subscription.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    });

    const limit = subscription?.competitorLimit || 5;

    return Response.json({
      competitors,
      limit,
      plan: subscription?.status || 'free',
      currentCount: competitors.length,
    });
  } catch (error) {
    console.error('Failed to fetch competitors:', error);
    return Response.json(
      { error: 'Failed to fetch competitors' },
      { status: 500 }
    );
  }
}

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
      include: {
        businesses: true,
      },
    });

    if (!user) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    // Get user's business
    if (!user.businesses || user.businesses.length === 0) {
      return Response.json(
        { error: 'Please complete business setup first' },
        { status: 400 }
      );
    }

    const business = user.businesses[0];

    // Get user's subscription
    const subscription = await db.subscription.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    });

    const limit = subscription?.competitorLimit || 5;

    // Check current competitor count
    const currentCount = await db.competitor.count({
      where: { businessId: business.id },
    });

    if (currentCount >= limit) {
      return Response.json(
        { error: `Competitor limit reached for ${plan} plan` },
        { status: 403 }
      );
    }

    // Validate request data
    const body = await req.json();
    const validatedData = createCompetitorSchema.parse(body);

    // Normalize URL
    const normalizedUrl = normalizeUrl(validatedData.url);

    // Check for duplicate URL
    const existingCompetitor = await db.competitor.findFirst({
      where: {
        businessId: business.id,
        url: normalizedUrl,
      },
    });

    if (existingCompetitor) {
      return Response.json(
        { error: 'This URL is already being monitored' },
        { status: 409 }
      );
    }

    // Create competitor
    const competitor = await db.competitor.create({
      data: {
        name: validatedData.name,
        url: normalizedUrl,
        crawlFrequencyMinutes: validatedData.crawlFrequencyMinutes,
        isActive: validatedData.isActive,
        businessId: business.id,
      },
    });

    return Response.json(
      {
        success: true,
        competitor: {
          id: competitor.id,
          name: competitor.name,
          url: competitor.url,
          crawlFrequencyMinutes: competitor.crawlFrequencyMinutes,
          isActive: competitor.isActive,
          createdAt: competitor.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Failed to create competitor:', error);

    // Handle Zod validation errors
    if (error.name === 'ZodError') {
      return Response.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }

    return Response.json(
      { error: 'Failed to create competitor' },
      { status: 500 }
    );
  }
}

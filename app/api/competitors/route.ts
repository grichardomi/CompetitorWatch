import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { db } from '@/lib/db/prisma';
import { createCompetitorSchema } from '@/lib/validation/competitor';
import { normalizeUrl } from '@/lib/utils/format';
import { canAddCompetitor } from '@/lib/middleware/check-subscription';
import { validateIndustryForCompetitor } from '@/lib/validation/industry-validation';
import { detectCompetitorIndustry } from '@/services/competitor/industry-detector';
import { type Industry } from '@/lib/config/industries';
import { apiLimiter, getClientIdentifier, rateLimitResponse } from '@/lib/rate-limit';
import { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
  const identifier = getClientIdentifier(req);
  const rateLimitResult = apiLimiter.check(req, 60, identifier);

  if (!rateLimitResult.success) {
    return rateLimitResponse(rateLimitResult.reset);
  }
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '50', 10);
    const skip = (page - 1) * pageSize;

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
          select: {
            id: true,
          },
        },
      },
    });

    if (!user) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    const businessId = user.businesses[0]?.id;

    if (!businessId) {
      return Response.json({
        competitors: [],
        limit: 5,
        plan: 'free',
        currentCount: 0,
        total: 0,
        page,
        pageSize,
      });
    }

    const [competitors, total, subscription] = await Promise.all([
      db.competitor.findMany({
        where: { businessId },
        include: {
          _count: {
            select: {
              alerts: { where: { isRead: false } },
              priceSnapshots: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
      db.competitor.count({ where: { businessId } }),
      db.subscription.findFirst({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const limit = subscription?.competitorLimit || 5;

    return Response.json({
      competitors,
      limit,
      plan: subscription?.status || 'free',
      currentCount: total,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (error) {
    console.error('Failed to fetch competitors:', error);
    return Response.json(
      { error: 'Failed to fetch competitors' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const identifier = getClientIdentifier(req);
    const rateLimitResult = apiLimiter.check(req, 10, identifier);

    if (!rateLimitResult.success) {
      return rateLimitResponse(rateLimitResult.reset);
    }

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

    // Validate industry allows competitor creation
    const industryValidation = await validateIndustryForCompetitor(business.id);
    if (!industryValidation.allowed) {
      return Response.json(
        { error: industryValidation.error || 'Cannot create competitor for this industry' },
        { status: 403 }
      );
    }

    // Check if user can add a competitor (validates subscription status and limit)
    const canAdd = await canAddCompetitor(user.id);

    if (!canAdd.allowed) {
      return Response.json(
        {
          error: canAdd.error,
          limit: canAdd.limit,
          current: canAdd.current,
        },
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

    // Create competitor immediately with business industry as default
    // Industry detection will happen asynchronously during first crawl
    const competitor = await db.competitor.create({
      data: {
        name: validatedData.name,
        url: normalizedUrl,
        crawlFrequencyMinutes: validatedData.crawlFrequencyMinutes,
        isActive: validatedData.isActive,
        businessId: business.id,
        detectedIndustry: business.industry,
        industry: business.industry,
        industryConfidence: 0.5,
      },
    });

    // Queue industry detection in background (non-blocking)
    detectCompetitorIndustry(
      normalizedUrl,
      undefined,
      business.industry as Industry
    ).then((industryDetection) => {
      // Update competitor with detected industry asynchronously
      db.competitor.update({
        where: { id: competitor.id },
        data: {
          detectedIndustry: industryDetection.industry,
          industry: industryDetection.industry,
          industryConfidence: industryDetection.confidence,
        },
      }).catch((err) => console.error('Failed to update industry:', err));
    }).catch((err) => console.error('Failed to detect industry:', err));

    return Response.json(
      {
        success: true,
        competitor: {
          id: competitor.id,
          name: competitor.name,
          url: competitor.url,
          crawlFrequencyMinutes: competitor.crawlFrequencyMinutes,
          isActive: competitor.isActive,
          industry: competitor.industry,
          detectedIndustry: competitor.detectedIndustry,
          industryConfidence: competitor.industryConfidence,
          createdAt: competitor.createdAt,
        },
        industryDetection: {
          status: 'pending',
          message: 'Industry detection is running in the background and will update shortly',
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

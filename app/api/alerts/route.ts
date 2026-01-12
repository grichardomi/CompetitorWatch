import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { db } from '@/lib/db/prisma';
import { apiLimiter, getClientIdentifier, rateLimitResponse } from '@/lib/rate-limit';
import { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const identifier = getClientIdentifier(req);
    const rateLimitResult = apiLimiter.check(req, 60, identifier);

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
      include: { businesses: true },
    });

    if (!user || !user.businesses || user.businesses.length === 0) {
      return Response.json({ alerts: [], total: 0 });
    }

    const business = user.businesses[0];

    // Parse query parameters
    const { searchParams } = new URL(req.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');
    const alertType = searchParams.get('alertType');
    const isRead = searchParams.get('isRead');
    const competitorId = searchParams.get('competitorId');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc';

    // Build where clause
    const where: any = {
      businessId: business.id,
    };

    if (alertType && alertType !== 'all') {
      where.alertType = alertType;
    }

    if (isRead !== null && isRead !== undefined && isRead !== 'all') {
      where.isRead = isRead === 'true';
    }

    if (competitorId && competitorId !== 'all') {
      where.competitorId = parseInt(competitorId);
    }

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) {
        where.createdAt.gte = new Date(dateFrom);
      }
      if (dateTo) {
        // Set to end of day
        const endDate = new Date(dateTo);
        endDate.setHours(23, 59, 59, 999);
        where.createdAt.lte = endDate;
      }
    }

    // Build sort order
    const orderBy: any = {};
    if (sortBy === 'createdAt') {
      orderBy.createdAt = sortOrder;
    } else if (sortBy === 'alertType') {
      orderBy.alertType = sortOrder;
    }

    // Get total count
    const total = await db.alert.count({ where });

    // Get alerts
    const alerts = await db.alert.findMany({
      where,
      include: {
        competitor: {
          select: {
            id: true,
            name: true,
            url: true,
          },
        },
      },
      orderBy,
      take: limit,
      skip: offset,
    });

    // Get alert type options for filters
    const alertTypes = await db.alert.groupBy({
      by: ['alertType'],
      where: { businessId: business.id },
      _count: true,
    });

    // Get competitor list for filters
    const competitors = await db.competitor.findMany({
      where: { businessId: business.id },
      select: {
        id: true,
        name: true,
        _count: {
          select: {
            alerts: { where: { businessId: business.id } },
          },
        },
      },
    });

    return Response.json({
      alerts,
      total,
      pagination: {
        limit,
        offset,
        hasMore: offset + limit < total,
      },
      filters: {
        alertTypes: alertTypes.map((at) => ({
          type: at.alertType,
          count: at._count,
        })),
        competitors: competitors.map((c) => ({
          id: c.id,
          name: c.name,
          count: c._count.alerts,
        })),
        readStatus: [
          { label: 'Unread', value: 'false' },
          { label: 'Read', value: 'true' },
        ],
      },
    });
  } catch (error) {
    console.error('Failed to fetch alerts:', error);
    return Response.json(
      { error: 'Failed to fetch alerts' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { alertIds, isRead } = body;

    if (!Array.isArray(alertIds) || typeof isRead !== 'boolean') {
      return Response.json(
        { error: 'Invalid request body' },
        { status: 400 }
      );
    }

    // Get user
    const user = await db.user.findUnique({
      where: { email: session.user.email },
      include: { businesses: true },
    });

    if (!user || !user.businesses || user.businesses.length === 0) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    const business = user.businesses[0];

    // Update alerts (only those belonging to this user's business)
    const updated = await db.alert.updateMany({
      where: {
        id: { in: alertIds },
        businessId: business.id,
      },
      data: { isRead },
    });

    return Response.json({
      success: true,
      updated: updated.count,
    });
  } catch (error) {
    console.error('Failed to update alerts:', error);
    return Response.json(
      { error: 'Failed to update alerts' },
      { status: 500 }
    );
  }
}

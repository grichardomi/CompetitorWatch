import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { db } from '@/lib/db/prisma';
import { updateCompetitorSchema } from '@/lib/validation/competitor';
import { normalizeUrl } from '@/lib/utils/format';

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
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

    // Get competitor and verify ownership
    const competitor = await db.competitor.findFirst({
      where: {
        id: parseInt(params.id),
        business: { userId: user.id },
      },
      include: {
        business: true,
        alerts: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
        priceSnapshots: {
          take: 30,
          orderBy: { detectedAt: 'desc' },
        },
      },
    });

    if (!competitor) {
      return Response.json(
        { error: 'Competitor not found' },
        { status: 404 }
      );
    }

    return Response.json(competitor);
  } catch (error) {
    console.error('Failed to fetch competitor:', error);
    return Response.json(
      { error: 'Failed to fetch competitor' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
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

    // Get competitor and verify ownership
    const competitor = await db.competitor.findFirst({
      where: {
        id: parseInt(params.id),
        business: { userId: user.id },
      },
    });

    if (!competitor) {
      return Response.json(
        { error: 'Competitor not found' },
        { status: 404 }
      );
    }

    // Validate request data
    const body = await req.json();
    const validatedData = updateCompetitorSchema.parse(body);

    // Check for duplicate URL if URL is being changed
    if (validatedData.url && validatedData.url !== competitor.url) {
      const normalizedUrl = normalizeUrl(validatedData.url);
      const existing = await db.competitor.findFirst({
        where: {
          businessId: competitor.businessId,
          url: normalizedUrl,
          id: { not: competitor.id },
        },
      });

      if (existing) {
        return Response.json(
          { error: 'This URL is already being monitored' },
          { status: 409 }
        );
      }

      validatedData.url = normalizedUrl;
    }

    // Update competitor
    const updated = await db.competitor.update({
      where: { id: competitor.id },
      data: {
        name: validatedData.name,
        url: validatedData.url,
        crawlFrequencyMinutes: validatedData.crawlFrequencyMinutes,
        isActive: validatedData.isActive,
      },
    });

    return Response.json(updated);
  } catch (error: any) {
    console.error('Failed to update competitor:', error);

    if (error.name === 'ZodError') {
      return Response.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }

    return Response.json(
      { error: 'Failed to update competitor' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
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

    // Get competitor and verify ownership
    const competitor = await db.competitor.findFirst({
      where: {
        id: parseInt(params.id),
        business: { userId: user.id },
      },
      include: {
        _count: {
          select: {
            alerts: true,
            priceSnapshots: true,
          },
        },
      },
    });

    if (!competitor) {
      return Response.json(
        { error: 'Competitor not found' },
        { status: 404 }
      );
    }

    // Delete competitor (cascades to alerts and snapshots)
    await db.competitor.delete({
      where: { id: competitor.id },
    });

    return Response.json({
      success: true,
      deleted: {
        competitorId: competitor.id,
        alertsDeleted: competitor._count.alerts,
        snapshotsDeleted: competitor._count.priceSnapshots,
      },
    });
  } catch (error) {
    console.error('Failed to delete competitor:', error);
    return Response.json(
      { error: 'Failed to delete competitor' },
      { status: 500 }
    );
  }
}

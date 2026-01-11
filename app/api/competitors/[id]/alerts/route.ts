import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { db } from '@/lib/db/prisma';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

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

    // Verify competitor ownership
    const competitor = await db.competitor.findFirst({
      where: {
        id: parseInt(id),
        business: { userId: user.id },
      },
    });

    if (!competitor) {
      return Response.json(
        { error: 'Competitor not found' },
        { status: 404 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Get alerts for competitor
    const alerts = await db.alert.findMany({
      where: {
        competitorId: competitor.id,
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });

    // Get total count
    const totalCount = await db.alert.count({
      where: {
        competitorId: competitor.id,
      },
    });

    return Response.json({
      alerts,
      pagination: {
        limit,
        offset,
        total: totalCount,
        hasMore: offset + limit < totalCount,
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

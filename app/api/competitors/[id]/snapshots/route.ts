import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { db } from '@/lib/db/prisma';

export async function GET(
  _req: Request,
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
        Business: { userId: user.id },
      },
    });

    if (!competitor) {
      return Response.json(
        { error: 'Competitor not found' },
        { status: 404 }
      );
    }

    // Get snapshots for price history (last 100)
    const snapshots = await db.priceSnapshot.findMany({
      where: {
        competitorId: competitor.id,
      },
      orderBy: { detectedAt: 'asc' },
      take: 100,
    });

    // Get total snapshot count
    const totalCount = await db.priceSnapshot.count({
      where: {
        competitorId: competitor.id,
      },
    });

    return Response.json({
      snapshots,
      metadata: {
        total: totalCount,
        shown: snapshots.length,
      },
    });
  } catch (error) {
    console.error('Failed to fetch snapshots:', error);
    return Response.json(
      { error: 'Failed to fetch snapshots' },
      { status: 500 }
    );
  }
}

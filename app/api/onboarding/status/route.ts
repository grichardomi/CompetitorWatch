import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { db } from '@/lib/db/prisma';

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
            competitors: true,
          },
        },
      },
    });

    if (!user) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    // Check onboarding status
    const isCompleted = !!user.onboardingCompletedAt;
    const hasBusiness = user.businesses && user.businesses.length > 0;
    const competitorCount = user.businesses?.[0]?.competitors?.length || 0;

    return Response.json({
      completed: isCompleted,
      completedAt: user.onboardingCompletedAt,
      hasBusiness,
      competitorCount,
      businessName: user.businesses?.[0]?.name || null,
    });
  } catch (error) {
    console.error('Onboarding status check error:', error);
    return Response.json(
      { error: 'Failed to check onboarding status' },
      { status: 500 }
    );
  }
}

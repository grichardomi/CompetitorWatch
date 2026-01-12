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
        Business: {
          include: {
            Competitor: true,
          },
        },
      },
    });

    if (!user) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    // Check onboarding status
    const isCompleted = !!user.onboardingCompletedAt;
    const hasBusiness = user.Business && user.Business.length > 0;
    const competitorCount = user.Business?.[0]?.Competitor?.length || 0;

    return Response.json({
      completed: isCompleted,
      completedAt: user.onboardingCompletedAt,
      hasBusiness,
      competitorCount,
      businessName: user.Business?.[0]?.name || null,
    });
  } catch (error) {
    console.error('Onboarding status check error:', error);
    return Response.json(
      { error: 'Failed to check onboarding status' },
      { status: 500 }
    );
  }
}

import { getServerSession } from 'next-auth';
import { db } from '@/lib/db/prisma';

export async function POST(req: Request) {
  try {
    // Check authentication
    const session = await getServerSession();
    if (!session?.user?.email) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user from database with relations
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

    // Validate that user has completed all steps
    if (!user.businesses || user.businesses.length === 0) {
      return Response.json(
        { error: 'Please complete business setup first' },
        { status: 400 }
      );
    }

    const business = user.businesses[0];
    if (!business.competitors || business.competitors.length === 0) {
      return Response.json(
        { error: 'Please add at least one competitor' },
        { status: 400 }
      );
    }

    // Mark onboarding as complete
    const updatedUser = await db.user.update({
      where: { id: user.id },
      data: {
        onboardingCompletedAt: new Date(),
      },
    });

    return Response.json({
      success: true,
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        onboardingCompletedAt: updatedUser.onboardingCompletedAt,
      },
    });
  } catch (error) {
    console.error('Onboarding completion error:', error);
    return Response.json(
      { error: 'Failed to complete onboarding' },
      { status: 500 }
    );
  }
}

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { db } from '@/lib/db/prisma';

export async function GET(req: Request) {
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
        notificationPreferences: true,
      },
    });

    if (!user) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    // If no preferences exist, create defaults
    if (!user.notificationPreferences) {
      const preferences = await db.notificationPreferences.create({
        data: {
          userId: user.id,
          alertTypes: ['price_change', 'new_promotion', 'menu_change'],
        },
      });
      return Response.json(preferences);
    }

    return Response.json(user.notificationPreferences);
  } catch (error) {
    console.error('Failed to fetch notification preferences:', error);
    return Response.json(
      { error: 'Failed to fetch notification preferences' },
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

    // Get user from database
    const user = await db.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    // Get request body
    const body = await req.json();

    // Get or create preferences
    let preferences = await db.notificationPreferences.findUnique({
      where: { userId: user.id },
    });

    if (!preferences) {
      preferences = await db.notificationPreferences.create({
        data: {
          userId: user.id,
          ...body,
        },
      });
    } else {
      preferences = await db.notificationPreferences.update({
        where: { userId: user.id },
        data: body,
      });
    }

    return Response.json(preferences);
  } catch (error) {
    console.error('Failed to update notification preferences:', error);
    return Response.json(
      { error: 'Failed to update notification preferences' },
      { status: 500 }
    );
  }
}

import { getServerSession } from 'next-auth';
import { db } from '@/lib/db/prisma';
import { preferencesSchema } from '@/lib/validation/onboarding';

export async function POST(req: Request) {
  try {
    // Check authentication
    const session = await getServerSession();
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

    // Parse and validate request body
    const body = await req.json();
    const validatedData = preferencesSchema.parse(body);

    // Update notification preferences (should already exist from auth)
    const preferences = await db.notificationPreferences.upsert({
      where: { userId: user.id },
      update: {
        emailEnabled: validatedData.emailEnabled,
        emailFrequency: validatedData.emailFrequency,
        alertTypes: validatedData.alertTypes,
        timezone: validatedData.timezone,
      },
      create: {
        userId: user.id,
        emailEnabled: validatedData.emailEnabled,
        emailFrequency: validatedData.emailFrequency,
        alertTypes: validatedData.alertTypes,
        timezone: validatedData.timezone,
      },
    });

    return Response.json({
      success: true,
      preferences,
    });
  } catch (error) {
    // Handle Zod validation errors
    if (error instanceof Error && error.message.includes('validation')) {
      return Response.json(
        { error: 'Invalid request data' },
        { status: 400 }
      );
    }

    console.error('Preferences update error:', error);
    return Response.json(
      { error: 'Failed to update preferences' },
      { status: 500 }
    );
  }
}

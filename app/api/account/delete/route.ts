import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { db } from '@/lib/db/prisma';
import { accountDeletionSchema } from '@/lib/validation/user';
import { verifyPassword } from '@/lib/auth/password';

export async function POST(req: Request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user from database
    const user = await db.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        email: true,
        password: true,
      },
    });

    if (!user) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    // Parse and validate request body
    const body = await req.json();
    const validatedData = accountDeletionSchema.parse(body);

    // If user has a password, verify it
    if (user.password) {
      if (!validatedData.password) {
        return Response.json(
          { error: 'Password is required to delete your account' },
          { status: 400 }
        );
      }

      const isPasswordValid = await verifyPassword(
        validatedData.password,
        user.password
      );

      if (!isPasswordValid) {
        return Response.json(
          { error: 'Password is incorrect' },
          { status: 401 }
        );
      }
    }

    // Delete user and all associated data in transaction
    // Note: Most data will cascade delete due to Prisma schema,
    // but we explicitly delete some items for clarity and safety
    await db.$transaction(async (tx) => {
      // Delete notification preferences
      await tx.notificationPreferences.deleteMany({
        where: { userId: user.id },
      });

      // Delete email queue items
      await tx.emailQueue.deleteMany({
        where: { userId: user.id },
      });

      // Delete SMS queue items
      await tx.smsQueue.deleteMany({
        where: { userId: user.id },
      });

      // Delete webhook destinations
      await tx.webhookDestination.deleteMany({
        where: { userId: user.id },
      });

      // Delete payments
      await tx.payment.deleteMany({
        where: { userId: user.id },
      });

      // Delete subscriptions
      await tx.subscription.deleteMany({
        where: { userId: user.id },
      });

      // Delete businesses (this cascades to competitors, alerts, snapshots, etc.)
      await tx.business.deleteMany({
        where: { userId: user.id },
      });

      // Delete OAuth accounts
      await tx.account.deleteMany({
        where: { userId: user.id },
      });

      // Delete sessions
      await tx.session.deleteMany({
        where: { userId: user.id },
      });

      // Finally, delete the user
      await tx.user.delete({
        where: { id: user.id },
      });
    });

    console.log(`Account deleted for user ${user.email} (ID: ${user.id})`);

    return Response.json({
      success: true,
      message: 'Your account has been permanently deleted.',
    });
  } catch (error: any) {
    console.error('Failed to delete account:', error);

    // Handle Zod validation errors
    if (error.name === 'ZodError') {
      return Response.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }

    return Response.json(
      { error: 'Failed to delete account. Please try again or contact support.' },
      { status: 500 }
    );
  }
}

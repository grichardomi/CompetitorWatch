import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { db } from '@/lib/db/prisma';
import { passwordChangeSchema } from '@/lib/validation/user';
import { hashPassword, verifyPassword } from '@/lib/auth/password';

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
    const validatedData = passwordChangeSchema.parse(body);

    // If user has a password, verify current password
    if (user.password) {
      if (!validatedData.currentPassword) {
        return Response.json(
          { error: 'Current password is required' },
          { status: 400 }
        );
      }

      const isPasswordValid = await verifyPassword(
        validatedData.currentPassword,
        user.password
      );

      if (!isPasswordValid) {
        return Response.json(
          { error: 'Current password is incorrect' },
          { status: 401 }
        );
      }
    }

    // Hash new password
    const hashedPassword = await hashPassword(validatedData.newPassword);

    // Update user password
    await db.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
      },
    });

    return Response.json({
      success: true,
      message: user.password
        ? 'Password changed successfully. Please sign in again.'
        : 'Password set successfully. You can now sign in with your password.',
    });
  } catch (error: any) {
    console.error('Failed to change password:', error);

    // Handle Zod validation errors
    if (error.name === 'ZodError') {
      return Response.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }

    // Handle password validation errors from hashPassword
    if (error.message?.includes('Invalid password')) {
      return Response.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return Response.json(
      { error: 'Failed to change password. Please try again.' },
      { status: 500 }
    );
  }
}

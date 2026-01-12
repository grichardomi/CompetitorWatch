import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { db } from '@/lib/db/prisma';
import { userProfileUpdateSchema } from '@/lib/validation/user';

export async function GET() {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user from database with accounts
    const user = await db.user.findUnique({
      where: { email: session.user.email },
      include: {
        accounts: {
          select: {
            provider: true,
          },
        },
      },
    });

    if (!user) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    // Determine auth methods
    const authMethods: string[] = [];
    if (user.password) {
      authMethods.push('password');
    }
    user.accounts.forEach((account) => {
      if (account.provider === 'google') {
        authMethods.push('google');
      }
    });

    return Response.json({
      id: user.id,
      email: user.email,
      name: user.name,
      image: user.image,
      hasPassword: !!user.password,
      authMethods,
      createdAt: user.createdAt,
      role: user.role,
    });
  } catch (error) {
    console.error('Failed to fetch profile:', error);
    return Response.json(
      { error: 'Failed to fetch profile' },
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

    // Parse and validate request body
    const body = await req.json();
    const validatedData = userProfileUpdateSchema.parse(body);

    // Check if email is being changed and if it's already in use
    if (validatedData.email && validatedData.email !== user.email) {
      const existingUser = await db.user.findUnique({
        where: { email: validatedData.email },
      });

      if (existingUser) {
        return Response.json(
          { error: 'This email is already in use' },
          { status: 409 }
        );
      }
    }

    // Update user
    const updatedUser = await db.user.update({
      where: { id: user.id },
      data: {
        ...(validatedData.name !== undefined && { name: validatedData.name }),
        ...(validatedData.email !== undefined && { email: validatedData.email }),
      },
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
        createdAt: true,
      },
    });

    return Response.json({
      success: true,
      user: updatedUser,
    });
  } catch (error: any) {
    console.error('Failed to update profile:', error);

    // Handle Zod validation errors
    if (error.name === 'ZodError') {
      return Response.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }

    return Response.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}

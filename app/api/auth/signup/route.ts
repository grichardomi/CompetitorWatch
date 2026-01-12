import { db } from '@/lib/db/prisma';
import { signUpSchema } from '@/lib/validation/user';
import { hashPassword } from '@/lib/auth/password';
import { authLimiter, getClientIdentifier, rateLimitResponse } from '@/lib/rate-limit';
import { NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const identifier = getClientIdentifier(req);
    const rateLimitResult = authLimiter.check(req, 5, identifier);

    if (!rateLimitResult.success) {
      return rateLimitResponse(rateLimitResult.reset);
    }

    // Parse and validate request body
    const body = await req.json();
    const validatedData = signUpSchema.parse(body);

    // Check if email already exists
    const existingUser = await db.user.findUnique({
      where: { email: validatedData.email },
    });

    if (existingUser) {
      return Response.json(
        { error: 'An account with this email already exists' },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await hashPassword(validatedData.password);

    // Create user
    const user = await db.user.create({
      data: {
        email: validatedData.email,
        name: validatedData.name,
        password: hashedPassword,
        updatedAt: new Date(),
        // emailVerified is null for email/password users until they verify
      },
      select: {
        id: true,
        email: true,
        name: true,
      },
    });

    return Response.json(
      {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Signup error:', error);

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
      { error: 'Failed to create account. Please try again.' },
      { status: 500 }
    );
  }
}

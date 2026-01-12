import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { db } from '@/lib/db/prisma';
import { businessUpdateSchema, hasIndustryField } from '@/lib/validation/business';

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
          orderBy: { createdAt: 'asc' },
          take: 1,
        },
      },
    });

    if (!user) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    if (!user.Business || user.Business.length === 0) {
      return Response.json(
        { error: 'No business found. Please complete onboarding first.' },
        { status: 404 }
      );
    }

    const business = user.Business[0];

    return Response.json({
      id: business.id,
      name: business.name,
      location: business.location,
      industry: business.industry,
      createdAt: business.createdAt,
      updatedAt: business.updatedAt,
    });
  } catch (error) {
    console.error('Failed to fetch business:', error);
    return Response.json(
      { error: 'Failed to fetch business' },
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
      include: {
        Business: {
          orderBy: { createdAt: 'asc' },
          take: 1,
        },
      },
    });

    if (!user) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    if (!user.Business || user.Business.length === 0) {
      return Response.json(
        { error: 'No business found. Please complete onboarding first.' },
        { status: 404 }
      );
    }

    const business = user.Business[0];

    // Parse request body
    const body = await req.json();

    // Check if industry field is present (not allowed)
    if (hasIndustryField(body)) {
      return Response.json(
        {
          error: 'Industry cannot be changed after onboarding. If you need to change your industry, please contact support.',
        },
        { status: 403 }
      );
    }

    // Validate request data
    const validatedData = businessUpdateSchema.parse(body);

    // Update business (only name and location allowed)
    const updatedBusiness = await db.business.update({
      where: { id: business.id },
      data: {
        ...(validatedData.name !== undefined && { name: validatedData.name }),
        ...(validatedData.location !== undefined && { location: validatedData.location }),
      },
      select: {
        id: true,
        name: true,
        location: true,
        industry: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return Response.json({
      success: true,
      business: updatedBusiness,
    });
  } catch (error: any) {
    console.error('Failed to update business:', error);

    // Handle Zod validation errors
    if (error.name === 'ZodError') {
      return Response.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }

    return Response.json(
      { error: 'Failed to update business' },
      { status: 500 }
    );
  }
}

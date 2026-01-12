import { getServerSession } from 'next-auth';
import { db } from '@/lib/db/prisma';
import { businessSchema } from '@/lib/validation/onboarding';
import { DEFAULT_INDUSTRY } from '@/lib/config/industries';

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
    const validatedData = businessSchema.parse(body);

    // Check if user already has a business
    const existingBusiness = await db.business.findFirst({
      where: { userId: user.id },
    });

    if (existingBusiness) {
      // Update existing business
      const updatedBusiness = await db.business.update({
        where: { id: existingBusiness.id },
        data: {
          name: validatedData.name,
          location: validatedData.location,
          industry: validatedData.industry,
        },
      });

      return Response.json({
        success: true,
        business: updatedBusiness,
      });
    }

    // Create new business
    const business = await db.business.create({
      data: {
        userId: user.id,
        name: validatedData.name,
        location: validatedData.location,
        industry: validatedData.industry || DEFAULT_INDUSTRY,
      },
    });

    return Response.json({
      success: true,
      business,
    });
  } catch (error) {
    // Handle Zod validation errors
    if (error instanceof Error && error.message.includes('validation')) {
      return Response.json(
        { error: 'Invalid request data' },
        { status: 400 }
      );
    }

    console.error('Business creation error:', error);
    return Response.json(
      { error: 'Failed to create business' },
      { status: 500 }
    );
  }
}

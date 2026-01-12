import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { db } from '@/lib/db/prisma';
import { INDUSTRIES, INDUSTRY_METADATA } from '@/lib/config/industries';

/**
 * Update business industry
 * This is a sensitive operation that should require user confirmation
 */
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
        Business: true,
      },
    });

    if (!user) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    // Get user's business
    if (!user.Business || user.Business.length === 0) {
      return Response.json(
        { error: 'No business found' },
        { status: 404 }
      );
    }

    const business = user.Business[0];

    // Parse and validate request
    const body = await req.json();
    const { newIndustry, confirmed } = body;

    // Validate industry
    if (!newIndustry || !Object.values(INDUSTRIES).includes(newIndustry)) {
      return Response.json(
        { error: 'Invalid industry. Must be one of: ' + Object.values(INDUSTRIES).join(', ') },
        { status: 400 }
      );
    }

    // Check if industry is actually changing
    if (business.industry === newIndustry) {
      return Response.json(
        { error: 'Business is already in this industry' },
        { status: 400 }
      );
    }

    // Require confirmation
    if (!confirmed) {
      return Response.json(
        {
          error: 'Confirmation required',
          requiresConfirmation: true,
          currentIndustry: business.industry,
          newIndustry,
          warning: `Changing your business industry from ${INDUSTRY_METADATA[business.industry as keyof typeof INDUSTRY_METADATA]?.label} to ${INDUSTRY_METADATA[newIndustry as keyof typeof INDUSTRY_METADATA]?.label} will affect default competitor detection and industry-specific features. This should only be done if your business type has fundamentally changed.`,
        },
        { status: 400 }
      );
    }

    // Update business industry
    const updatedBusiness = await db.business.update({
      where: { id: business.id },
      data: {
        industry: newIndustry,
        updatedAt: new Date(),
      },
    });

    // Log the change for audit trail (optional but recommended)
    console.log(
      `[AUDIT] Business ${business.id} industry changed from ${business.industry} to ${newIndustry} by user ${user.email}`
    );

    return Response.json({
      success: true,
      message: 'Business industry updated successfully',
      business: {
        id: updatedBusiness.id,
        industry: updatedBusiness.industry,
        updatedAt: updatedBusiness.updatedAt,
      },
    });
  } catch (error: any) {
    console.error('Failed to update business industry:', error);

    return Response.json(
      { error: 'Failed to update business industry' },
      { status: 500 }
    );
  }
}

import { getServerSession } from 'next-auth';
import { db } from '@/lib/db/prisma';
import { competitorSchema } from '@/lib/validation/onboarding';

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

    // Find user's business
    const business = await db.business.findFirst({
      where: { userId: user.id },
    });

    if (!business) {
      return Response.json(
        { error: 'Please complete business setup first' },
        { status: 404 }
      );
    }

    // Parse and validate request body
    const body = await req.json();
    const validatedData = competitorSchema.parse(body);

    // Normalize URL
    let normalizedUrl = validatedData.url;
    if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
      normalizedUrl = 'https://' + normalizedUrl;
    }

    // Check for duplicate competitor URL
    const existingCompetitor = await db.competitor.findUnique({
      where: {
        businessId_url: {
          businessId: business.id,
          url: normalizedUrl,
        },
      },
    });

    if (existingCompetitor) {
      return Response.json(
        { error: 'You are already monitoring this competitor' },
        { status: 409 }
      );
    }

    // Create competitor
    const competitor = await db.competitor.create({
      data: {
        businessId: business.id,
        name: validatedData.name,
        url: normalizedUrl,
        crawlFrequencyMinutes: 720, // 12 hours default
      },
    });

    return Response.json({
      success: true,
      competitor,
    });
  } catch (error) {
    // Handle Zod validation errors
    if (error instanceof Error && error.message.includes('validation')) {
      return Response.json(
        { error: 'Invalid request data' },
        { status: 400 }
      );
    }

    console.error('Competitor creation error:', error);
    return Response.json(
      { error: 'Failed to add competitor' },
      { status: 500 }
    );
  }
}

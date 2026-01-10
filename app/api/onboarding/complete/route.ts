import { getServerSession } from 'next-auth';
import { db } from '@/lib/db/prisma';
import { renderEmailTemplate, generateSubject } from '@/lib/email/render';
import { sendEmail } from '@/lib/email/client';

export async function POST(req: Request) {
  try {
    // Check authentication
    const session = await getServerSession();
    if (!session?.user?.email) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user from database with relations
    const user = await db.user.findUnique({
      where: { email: session.user.email },
      include: {
        businesses: {
          include: {
            competitors: true,
          },
        },
      },
    });

    if (!user) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    // Validate that user has completed all steps
    if (!user.businesses || user.businesses.length === 0) {
      return Response.json(
        { error: 'Please complete business setup first' },
        { status: 400 }
      );
    }

    const business = user.businesses[0];
    if (!business.competitors || business.competitors.length === 0) {
      return Response.json(
        { error: 'Please add at least one competitor' },
        { status: 400 }
      );
    }

    // Mark onboarding as complete
    const updatedUser = await db.user.update({
      where: { id: user.id },
      data: {
        onboardingCompletedAt: new Date(),
      },
    });

    // Create trial subscription (14 days)
    const trialEnd = new Date();
    trialEnd.setDate(trialEnd.getDate() + 14);

    // Check if subscription already exists
    const existingSubscription = await db.subscription.findFirst({
      where: { userId: user.id },
    });

    if (!existingSubscription) {
      await db.subscription.create({
        data: {
          userId: user.id,
          stripeSubscriptionId: `trial_${user.id}`, // Temporary ID until actual Stripe subscription
          stripePriceId: 'trial',
          status: 'trialing',
          currentPeriodStart: new Date(),
          currentPeriodEnd: trialEnd,
          competitorLimit: 5, // Free trial limit (Starter plan)
        },
      });
    }

    // Send welcome email
    try {
      const emailResult = await renderEmailTemplate({
        templateName: 'welcome_email',
        templateData: {
          userName: user.name || 'there',
          trialEndDate: trialEnd.toISOString(),
          dashboardUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
        },
      });

      if (emailResult.success && emailResult.html && typeof emailResult.html === 'string') {
        await sendEmail({
          to: user.email!,
          subject: generateSubject('welcome'),
          html: emailResult.html,
        });
      } else {
        console.error('Email render failed:', emailResult.error || 'HTML is not a string');
      }
    } catch (emailError) {
      // Log error but don't fail onboarding
      console.error('Failed to send welcome email:', emailError);
    }

    // Schedule trial reminder emails for Day 7, 11, and 14
    const day7 = new Date();
    day7.setDate(day7.getDate() + 7);

    const day11 = new Date();
    day11.setDate(day11.getDate() + 11);

    const day14 = new Date();
    day14.setDate(day14.getDate() + 14);

    await db.emailQueue.createMany({
      data: [
        {
          userId: user.id,
          toEmail: user.email!,
          templateName: 'trial_day7_reminder',
          templateData: {
            userName: user.name || 'there',
            dashboardUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
            competitorsCount: business.competitors.length,
          },
          scheduledFor: day7,
          status: 'pending',
        },
        {
          userId: user.id,
          toEmail: user.email!,
          templateName: 'trial_day11_reminder',
          templateData: {
            userName: user.name || 'there',
            dashboardUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
            pricingUrl: `${process.env.NEXT_PUBLIC_APP_URL}/pricing`,
          },
          scheduledFor: day11,
          status: 'pending',
        },
        {
          userId: user.id,
          toEmail: user.email!,
          templateName: 'trial_ended',
          templateData: {
            userName: user.name || 'there',
            dashboardUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
          },
          scheduledFor: day14,
          status: 'pending',
        },
      ],
    });

    return Response.json({
      success: true,
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        onboardingCompletedAt: updatedUser.onboardingCompletedAt,
      },
      trial: {
        endsAt: trialEnd,
        daysRemaining: 14,
      },
    });
  } catch (error) {
    console.error('Onboarding completion error:', error);
    return Response.json(
      { error: 'Failed to complete onboarding' },
      { status: 500 }
    );
  }
}

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { db } from '@/lib/db/prisma';

export async function GET(request: Request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const requestedUserId = searchParams.get('userId');

    // Get current user from database
    const currentUser = await db.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true },
    });

    if (!currentUser) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    // Determine which user's payments to fetch
    let targetUserId = currentUser.id;

    // If userId is requested, check if user is admin
    if (requestedUserId) {
      if (currentUser.role !== 'admin') {
        return Response.json({ error: 'Admin access required' }, { status: 403 });
      }
      targetUserId = requestedUserId;
    }

    // Get payment history
    const payments = await db.payment.findMany({
      where: { userId: targetUserId },
      orderBy: { createdAt: 'desc' },
      take: 50, // Last 50 payments
    });

    return Response.json({
      payments: payments.map(payment => ({
        id: payment.id,
        userId: payment.userId,
        stripePaymentId: payment.stripePaymentIntentId,
        amount: payment.amount,
        currency: payment.currency,
        status: payment.status,
        createdAt: payment.createdAt,
        // Format amount for display
        amountFormatted: `$${(payment.amount / 100).toFixed(2)}`,
      })),
    });
  } catch (error) {
    console.error('Failed to fetch payments:', error);
    return Response.json(
      { error: 'Failed to fetch payments' },
      { status: 500 }
    );
  }
}

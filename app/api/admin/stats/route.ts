import { checkAdminAccess } from '@/lib/auth/check-admin';
import { db } from '@/lib/db/prisma';

export async function GET() {
  try {
    // Check admin access
    const { authorized } = await checkAdminAccess();
    if (!authorized) {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Get total users
    const totalUsers = await db.user.count();

    // Get active subscriptions
    const activeSubscriptions = await db.subscription.count({
      where: { status: 'active' },
    });

    // Get total revenue (sum of all successful payments)
    const payments = await db.payment.aggregate({
      where: { status: 'succeeded' },
      _sum: { amount: true },
    });
    const totalRevenue = payments._sum.amount || 0;

    // Get recent signups (last 10)
    const recentSignups = await db.user.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
      },
    });

    return Response.json({
      totalUsers,
      activeSubscriptions,
      totalRevenue,
      recentSignups,
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    return Response.json(
      { error: 'Failed to fetch admin stats' },
      { status: 500 }
    );
  }
}

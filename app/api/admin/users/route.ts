import { checkAdminAccess } from '@/lib/auth/check-admin';
import { db } from '@/lib/db/prisma';

export async function GET() {
  try {
    // Check admin access
    const { authorized } = await checkAdminAccess();
    if (!authorized) {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Get all users with their subscriptions and business count
    const users = await db.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        password: true,
        subscriptions: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: {
            status: true,
            stripePriceId: true,
          },
        },
        accounts: {
          select: {
            provider: true,
          },
        },
        _count: {
          select: {
            businesses: true,
          },
        },
      },
    });

    // Format response
    const formattedUsers = users.map((user) => {
      const authMethods: string[] = [];
      if (user.password) authMethods.push('password');
      user.accounts.forEach((account) => {
        if (account.provider === 'google') authMethods.push('google');
      });

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        createdAt: user.createdAt,
        subscription: user.subscriptions[0] || null,
        authMethods,
        _count: user._count,
      };
    });

    return Response.json({ users: formattedUsers });
  } catch (error) {
    console.error('Admin users error:', error);
    return Response.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

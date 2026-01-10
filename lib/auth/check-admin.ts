import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';

interface AdminCheckResult {
  authorized: boolean;
  user: any | null;
  reason?: string;
}

/**
 * Check if the current user has admin access
 * @returns Object with authorization status and user info
 */
export async function checkAdminAccess(): Promise<AdminCheckResult> {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return { authorized: false, user: null, reason: 'Not authenticated' };
  }

  // Role is in session after auth callbacks update
  if (session.user.role !== 'admin') {
    return { authorized: false, user: session.user, reason: 'Not admin' };
  }

  return { authorized: true, user: session.user };
}

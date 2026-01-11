import type { NextAuthOptions } from 'next-auth';
import Google from 'next-auth/providers/google';

if (!process.env.NEXTAUTH_SECRET) {
  throw new Error('NEXTAUTH_SECRET is not set');
}

if (!process.env.NEXTAUTH_URL) {
  throw new Error('NEXTAUTH_URL is not set');
}

export const authConfig: NextAuthOptions = {
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    }),
  ],
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
};

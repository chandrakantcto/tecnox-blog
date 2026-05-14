import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { connectToDatabase } from './mongodb';
import type { UserRole } from '@/types/user.types';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        try {
          await connectToDatabase();
          const { User } = await import('@/models/User');
          const bcrypt = await import('bcryptjs');

          const user = await User.findOne({
            email: credentials.email.toLowerCase(),
            isActive: true,
          }).select('+password');

          if (!user) return null;

          const isValid = await bcrypt.compare(credentials.password, user.password);
          if (!isValid) return null;

          await User.findByIdAndUpdate(user._id, { lastLoginAt: new Date() });

          return {
            id: String(user._id),
            name: user.name,
            email: user.email,
            role: user.role,
            image: user.avatar,
          };
        } catch (error) {
          console.error('[Auth] Error during authorization:', error);
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60,
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as unknown as { role: UserRole }).role;
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { role: UserRole; id: string }).role = token.role as UserRole;
        (session.user as { id: string }).id = token.id as string;
      }
      return session;
    },
  },
  pages: {
    signIn: '/admin/login',
    error: '/admin/login',
  },
  secret: process.env.NEXTAUTH_SECRET,
};

export function hasRole(userRole: UserRole, requiredRole: UserRole): boolean {
  const hierarchy: UserRole[] = ['editor', 'admin', 'super_admin'];
  return hierarchy.indexOf(userRole) >= hierarchy.indexOf(requiredRole);
}

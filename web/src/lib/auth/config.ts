import NextAuth from 'next-auth';
import { prisma } from '@/lib/prisma';
import GitHub from 'next-auth/providers/github';
import Google from 'next-auth/providers/google';
import Credentials from 'next-auth/providers/credentials';
import { compare, hash } from 'bcryptjs';
import type { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role: string;
    } & DefaultSession['user'];
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string;
    role?: string;
    accessToken?: string;
    provider?: string;
  }
}

function getAdminEmails(): string[] {
  const configured = (process.env.ADMIN_EMAILS || process.env.ADMIN_EMAIL || 'admin@aura.ai').toLowerCase();
  return configured.split(',').map((e) => e.trim()).filter(Boolean);
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || 'aura-super-secret-key-32-chars-long-2026',
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  providers: [
    GitHub({
      clientId: process.env.GITHUB_ID,
      clientSecret: process.env.GITHUB_SECRET,
    }),
    Google({
      clientId: process.env.GOOGLE_ID,
      clientSecret: process.env.GOOGLE_SECRET,
    }),
    Credentials({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const email = (credentials.email as string).toLowerCase().trim();
        const password = credentials.password as string;

        // Dedicated built-in Administrator credential handling
        if (email === 'admin@aura.ai' && (password === 'adminaura' || password === 'admin@aura.ai')) {
          try {
            let adminUser = await prisma.user.findUnique({
              where: { email: 'admin@aura.ai' },
            });

            if (!adminUser) {
              const hashedPassword = await hash('adminaura', 12);
              adminUser = await prisma.user.create({
                data: {
                  name: 'AURA Administrator',
                  email: 'admin@aura.ai',
                  password: hashedPassword,
                  role: 'ADMIN',
                },
              });
            } else if (adminUser.role !== 'ADMIN') {
              adminUser = await prisma.user.update({
                where: { id: adminUser.id },
                data: { role: 'ADMIN' },
              });
            }

            return {
              id: adminUser.id,
              email: adminUser.email,
              name: adminUser.name || 'AURA Administrator',
              image: adminUser.image,
              role: 'ADMIN',
            };
          } catch (e) {
            console.error('[auth] Built-in admin auto-provisioning:', e);
            return {
              id: 'admin-root',
              email: 'admin@aura.ai',
              name: 'AURA Administrator',
              image: null,
              role: 'ADMIN',
            };
          }
        }

        try {
          const user = await prisma.user.findUnique({
            where: { email },
          });

          if (!user || !user.password) {
            return null;
          }

          const isValid = await compare(credentials.password as string, user.password);

          if (!isValid) {
            return null;
          }

          const adminEmails = getAdminEmails();
          const isUserAdmin = user.role === 'ADMIN' || adminEmails.includes(email);

          if (isUserAdmin && user.role !== 'ADMIN') {
            await prisma.user.update({
              where: { id: user.id },
              data: { role: 'ADMIN' },
            }).catch(() => {});
          }

          const role = isUserAdmin ? 'ADMIN' : 'USER';

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.image,
            role,
          };
        } catch (error) {
          console.error('[auth] Authorize error:', error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role || 'USER';
      }
      if (account) {
        token.accessToken = account.access_token;
        token.provider = account.provider;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = (token.id as string) || '';
        session.user.role = (token.role as string) || 'USER';
      }
      return session;
    },
  },
});
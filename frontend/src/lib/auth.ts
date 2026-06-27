import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const email = credentials.email as string;
        const password = credentials.password as string;

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user || !user.passwordHash) return null;

        if (user.locked) {
          if (user.lockedAt) {
            const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000);
            if (user.lockedAt > thirtyMinAgo) {
              throw new Error("Account locked due to too many failed attempts. Try again in 30 minutes.");
            }
            await prisma.user.update({ where: { id: user.id }, data: { locked: false, lockedAt: null } });
          } else {
            throw new Error("Account locked. Contact support.");
          }
        }

        const valid = await bcrypt.compare(password, user.passwordHash);

        await prisma.loginAttempt.create({
          data: { email, success: valid },
        });

        if (!valid) {
          const recentFails = await prisma.loginAttempt.count({
            where: {
              email,
              success: false,
              createdAt: { gte: new Date(Date.now() - 30 * 60 * 1000) },
            },
          });
          if (recentFails >= 5) {
            await prisma.user.update({ where: { id: user.id }, data: { locked: true, lockedAt: new Date() } });
          }
          return null;
        }

        if (!user.emailVerified) {
          throw new Error("EMAIL_NOT_VERIFIED:" + email);
        }

        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        });

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: { role: true, orgId: true, emailVerified: true },
        });
        if (dbUser) {
          token.role = dbUser.role;
          token.orgId = dbUser.orgId;
          token.emailVerified = !!dbUser.emailVerified;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        const u = session.user as unknown as Record<string, unknown>;
        u.id = token.sub!;
        u.role = token.role;
        u.orgId = token.orgId;
        u.emailVerified = token.emailVerified;
      }
      return session;
    },
  },
});

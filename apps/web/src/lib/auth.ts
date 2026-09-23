// apps/web/src/lib/auth.ts
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        });

        if (!user) return null;

        const isValid = await bcrypt.compare(
          credentials.password as string,
          user.password
        );
        if (!isValid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          licenseId: user.licenseId,
          suspended: user.suspended,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.licenseId = (user as any).licenseId;
        token.suspended = (user as any).suspended;
      }
      if (trigger === "update" && session?.licenseId) {
        token.licenseId = session.licenseId;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        (session.user as any).role = token.role;
        (session.user as any).licenseId = token.licenseId;
        (session.user as any).suspended = token.suspended;
      }
      return session;
    },
  },
  session: {
    strategy: "jwt",
    maxAge: 3 * 60 * 60,       // 3 hours absolute
    updateAge: 30 * 60,        // refresh every 30 minutes
  },
  pages: {
    signIn: "/login",
  },
});
import type { NextAuthConfig } from "next-auth"

// This config is used in middleware (Edge Runtime) - NO Prisma, NO bcrypt
export const authConfig = {
    providers: [], // Providers are added in auth.ts (Node.js runtime only)
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.role = (user as any).role
                token.id = user.id
            }
            return token
        },
        async session({ session, token }) {
            if (session.user && token) {
                (session.user as any).id = token.id as string;
                (session.user as any).role = token.role as string
            }
            return session
        }
    },
    pages: {
        signIn: "/login",
    },
    session: { strategy: "jwt" }
} satisfies NextAuthConfig

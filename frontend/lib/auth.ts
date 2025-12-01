import type { LoggerInstance } from 'next-auth';
import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3005";

const logger: LoggerInstance = {
    error: (code: any, ...message: any[]) => {
        if (code.name === 'CredentialsSignin') {
            return;
        }
        console.error('[auth][error]', code, ...message);
    },
    warn: (code: any, ...message: any[]) => {
        console.warn('[auth][warn]', code, ...message);
    },
    debug: (code: any, ...message: any[]) => {
        if (process.env.NODE_ENV === 'development') {
            console.debug('[auth][debug]', code, ...message);
        }
    },
};

export const { handlers, signIn, signOut, auth } = NextAuth({
    logger,
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
                if (!credentials?.email || !credentials?.password) {
                    return null;
                }

                try {
                    const response = await fetch(`${API_URL}/auth/login`, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                            email: credentials.email,
                            password: credentials.password,
                        }),
                    });

                    if (!response.ok) {
                        return null;
                    }

                    const data = await response.json();

                    return {
                        id: data.user.id,
                        email: data.user.email,
                        name: data.user.name,
                        accessToken: data.accessToken,
                    };
                } catch (error) {
                    console.error("Auth error:", error);
                    return null;
                }
            },
        }),
    ],
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
                token.accessToken = user.accessToken;
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.id = token.id as string;
            }
            if (token.accessToken) {
                session.accessToken = token.accessToken as string;
            }
            return session;
        },
    },
});
import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';

import { config } from './configuration';

const API_URL = config.apiUrl;

const logger = {
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
        if (config.nodeEnv === 'development') {
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
            // @ts-ignore
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
                        userRole: data.user.userRole,
                        siteUsers: data.user.siteUsers,
                        organizationId: data.user.organizationId,
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
                token.accessToken = (user as any).accessToken;
                token.userRole = (user as any).userRole;
                token.siteUsers = (user as any).siteUsers;
                token.organizationId = (user as any).organizationId;
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.id = token.id as string;
            }
            if (token?.organizationId) {
                session.user.organizationId = token.organizationId as string;
            }
            if (token?.userRole) {
                // @ts-expect-error - next-auth user typing is extended at runtime
                session.user.userRole = token.userRole;
            }
            if (token?.siteUsers) {
                // @ts-expect-error - next-auth user typing is extended at runtime
                session.user.siteUsers = token.siteUsers;
            }
            if (token.accessToken) {
                session.accessToken = token.accessToken as string;
            }
            return session;
        },
    },
});

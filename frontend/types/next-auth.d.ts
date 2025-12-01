// types/next-auth.d.ts

import { DefaultSession } from 'next-auth';

declare module 'next-auth' {
    interface Session extends DefaultSession {
        accessToken?: string;
        user?: {
            id: string;
        } & DefaultSession["user"]
    }

    interface User {
        id: string;
        email: string;
        name: string;
        accessToken: string;
    }
}

declare module 'next-auth/jwt' {
    interface JWT {
        id: string;
        accessToken?: string;
    }
}
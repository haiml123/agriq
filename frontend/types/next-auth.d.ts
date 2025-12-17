import { DefaultSession } from 'next-auth';

declare module 'next-auth' {
    interface Session extends DefaultSession {
        accessToken?: string;
        user?: {
            id: string;
            roles: any[];
            userRole?: string;
            organizationId: string | null;
        } & DefaultSession["user"]
    }

    interface User {
        id: string;
        email: string;
        name: string;
        roles?: string[];                    // Add this
        organizationId?: string;      // Add this
        userRole?: string;
        accessToken: string;
    }
}

declare module 'next-auth/jwt' {
    interface JWT {
        id: string;
        roles: any[];                    // Add this
        organizationId: string | null;      // Add this
        userRole?: string;
        accessToken?: string;
    }
}

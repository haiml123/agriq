import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';


const isJwtValid = (token?: string) => {
    if (!token) return false;

    try {
        const payloadSegment = token.split('.')[1];

        if (!payloadSegment) return false;

        const decodedPayload = JSON.parse(
            atob(payloadSegment.replace(/-/g, '+').replace(/_/g, '/')),
        );

        if (!decodedPayload?.exp) return false;

        return decodedPayload.exp * 1000 > Date.now();
    } catch (error) {
        console.error('Failed to validate JWT in middleware', error);
        return false;
    }
};


export default auth((req) => {
    const accessToken = req.auth?.accessToken as string | undefined;
    const isLoggedIn = isJwtValid(accessToken);
    const isProtectedRoute =
        req.nextUrl.pathname.startsWith('/dashboard') ||
        req.nextUrl.pathname.startsWith('/sites') ||
        req.nextUrl.pathname.startsWith('/alerts') ||
        req.nextUrl.pathname.startsWith('/settings');
    const isAuthRoute = req.nextUrl.pathname === '/login';

    if (isProtectedRoute && !isLoggedIn) {
        return NextResponse.redirect(new URL('/login', req.nextUrl));
    }

    if (isAuthRoute && isLoggedIn) {
        return NextResponse.redirect(new URL('/dashboard', req.nextUrl));
    }

    return NextResponse.next();
});

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};
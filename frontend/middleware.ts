import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';
import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

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

// Create the next-intl middleware
const intlMiddleware = createMiddleware(routing);

export default auth((req) => {
    const accessToken = req.auth?.accessToken as string | undefined;
    const isLoggedIn = isJwtValid(accessToken);

    const pathname = req.nextUrl.pathname;

    // Extract the pathname without locale prefix for route matching
    const pathnameWithoutLocale = pathname.replace(/^\/(en|he|ar|th)/, '') || '/';

    const isProtectedRoute =
        pathnameWithoutLocale.startsWith('/dashboard') ||
        pathnameWithoutLocale.startsWith('/sites') ||
        pathnameWithoutLocale.startsWith('/alerts') ||
        pathnameWithoutLocale.startsWith('/settings') ||
        pathnameWithoutLocale.startsWith('/admin');
    const isAuthRoute = pathnameWithoutLocale === '/login';

    if (isProtectedRoute && !isLoggedIn) {
        // Extract locale from pathname
        const localeMatch = pathname.match(/^\/(en|he|ar|th)/);
        const locale = localeMatch ? localeMatch[1] : 'en';
        return NextResponse.redirect(new URL(`/${locale}/login`, req.nextUrl));
    }

    if (isAuthRoute && isLoggedIn) {
        // Extract locale from pathname
        const localeMatch = pathname.match(/^\/(en|he|ar|th)/);
        const locale = localeMatch ? localeMatch[1] : 'en';
        return NextResponse.redirect(new URL(`/${locale}/dashboard`, req.nextUrl));
    }

    // Run the next-intl middleware
    return intlMiddleware(req);
});

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};
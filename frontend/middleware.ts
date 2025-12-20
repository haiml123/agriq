import { auth } from '@/lib/auth';
import createMiddleware from 'next-intl/middleware';
import { NextResponse } from 'next/server';
import { routing } from '@/i18n/routing';

const intlMiddleware = createMiddleware(routing);

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

const getLocaleFromPathname = (pathname: string) =>
    routing.locales.find(
        (locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`),
    );

export default auth((req) => {
    const intlResponse = intlMiddleware(req);
    const redirectLocation = intlResponse.headers.get('location');

    if (redirectLocation) {
        return intlResponse;
    }

    const accessToken = req.auth?.accessToken as string | undefined;
    const isLoggedIn = isJwtValid(accessToken);
    const pathname = req.nextUrl.pathname;
    const locale = getLocaleFromPathname(pathname) ?? routing.defaultLocale;
    const localePrefix = `/${locale}`;
    const pathnameWithoutLocale = pathname.startsWith(localePrefix)
        ? pathname.slice(localePrefix.length) || '/'
        : pathname;
    const isProtectedRoute =
        pathnameWithoutLocale.startsWith('/dashboard') ||
        pathnameWithoutLocale.startsWith('/sites') ||
        pathnameWithoutLocale.startsWith('/alerts') ||
        pathnameWithoutLocale.startsWith('/settings') ||
        pathnameWithoutLocale.startsWith('/admin');
    const isAuthRoute = pathnameWithoutLocale === '/login';

    if (isProtectedRoute && !isLoggedIn) {
        return NextResponse.redirect(new URL(`${localePrefix}/login`, req.nextUrl));
    }

    if (isAuthRoute && isLoggedIn) {
        return NextResponse.redirect(new URL(`${localePrefix}/dashboard`, req.nextUrl));
    }

    return intlResponse;
});

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};

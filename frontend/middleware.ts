import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
    const isLoggedIn = !!req.auth;
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
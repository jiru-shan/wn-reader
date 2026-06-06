import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const protectedRoutes = [
  '/dashboard',
  '/novel',
];

export default async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const sessionCookie =
    req.cookies.get('__Secure-neon-auth.session_token') ??
    req.cookies.get('neon-auth.session_token');

  const isLoggedIn = !!sessionCookie?.value;
  const isProtected = protectedRoutes.some((route) => pathname.startsWith(route));

  if ((pathname.startsWith('/auth/sign-in') || pathname.startsWith('/auth/sign-up')) && isLoggedIn) {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  if (isProtected && !isLoggedIn) {
    return NextResponse.redirect(new URL('/auth/sign-in', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/auth/sign-in',
    '/reader/:path*',
    '/dashboard/:path*',
    '/library/:path*',
    '/bookmarks/:path*',
    '/profile/:path*',
    '/settings/:path*',
    '/novel/:path*',
  ],
};
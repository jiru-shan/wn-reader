import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

//redirects logged in people to dashboard when on sign-up or sign-in
//also redirects not logged in people tot sign-in or sign-up

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

  //redirects to dashboard
  if ((pathname.startsWith('/auth/sign-in') || pathname.startsWith('/auth/sign-up')) && isLoggedIn) {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  //redirects to signin
  if (isProtected && !isLoggedIn) {
    return NextResponse.redirect(new URL('/auth/sign-in', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/auth/sign-in',
    '/auth/sign-up',
    '/dashboard/:path*',
    '/novel/:path*',
  ],
};
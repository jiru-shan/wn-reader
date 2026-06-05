import { auth } from '@/app/lib/auth/server';

export default auth.middleware({ loginUrl: '/auth/sign-in' });

export const config = {
  matcher: [
    '/reader/:path*',
    '/dashboard/:path*',
    '/dashboard-test/:path*',
    '/library/:path*',
    '/bookmarks/:path*',
    '/profile/:path*',
    '/settings/:path*',
    '/novel/:path*',
  ],
};

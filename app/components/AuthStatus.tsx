'use client';

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { authClient } from '@/app/lib/auth/client';

//auth status bar at the top of (almost) every page - added in layout.tsx
export default function AuthStatus() {
  const router = useRouter();
  const pathname = usePathname();
  const session = authClient.useSession();
  const [signingOut, setSigningOut] = useState(false);

  //unnecessary for the scraper-widget as well as on the novel reading page
  if (pathname.startsWith('/novel') || pathname.startsWith('/admin')) {
    return null;
  }

  async function handleSignOut() {
    setSigningOut(true);
    try {
      await authClient.signOut();
      router.push('/');
      router.refresh();
    } catch {
      setSigningOut(false);
    }
  }

  if (session.isPending) {
    return (
      <nav className="sticky top-0 z-50 flex justify-between items-center p-4 bg-white border-b border-neutral-200">
        <Link href="/dashboard" className="text-sm font-bold text-neutral-900">wn-reader</Link>
        <span className="text-sm text-neutral-400">Loading...</span>
      </nav>
    );
  }

  if (!session.data) {
    return (
      <nav className="sticky top-0 z-50 flex justify-between items-center p-4 bg-white border-b border-neutral-200">
        <Link href="/dashboard" className="text-sm font-bold text-neutral-900">wn-reader</Link>
        <Link href="/auth/sign-in" className="text-sm font-medium hover:underline">
          Sign in
        </Link>
      </nav>
    );
  }

  const displayName =
    session.data.user.name?.trim() ||
    session.data.user.email ||
    'Reader';

  return (
    <nav className="sticky top-0 z-50 flex justify-between items-center p-4 bg-white border-b border-neutral-200">
      <div className="flex items-center gap-4">
        <Link href="/dashboard" className="text-sm font-bold text-neutral-900">wn-reader</Link>
        <span className="text-sm text-neutral-600">Welcome, {displayName}</span>
      </div>
      <button
        onClick={handleSignOut}
        disabled={signingOut}
        className="text-sm font-medium hover:underline disabled:opacity-50"
      >
        {signingOut ? 'Signing out...' : 'Sign out'}
      </button>
    </nav>
  );
}
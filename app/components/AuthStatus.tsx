'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authClient } from '@/app/lib/auth/client';

export default function AuthStatus() {
  const router = useRouter();
  const session = authClient.useSession();
  const [signingOut, setSigningOut] = useState(false);

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
      <nav className="sticky top-0 z-50 flex justify-end p-4 bg-white border-b border-neutral-200">
        <span className="text-sm text-neutral-400">Loading...</span>
      </nav>
    );
  }

  if (!session.data) {
    return (
      <nav className="sticky top-0 z-50 flex justify-end p-4 bg-white border-b border-neutral-200">
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
      <span className="text-sm text-neutral-600">Welcome, {displayName}</span>
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

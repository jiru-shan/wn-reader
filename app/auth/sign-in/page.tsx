'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authClient } from '@/app/lib/auth/client';

//for auth we are making use of NeonDB's built in auth that runs on betterAuth. Submit to the auth
//by collecting the info in forms and then submitting to the db
export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (loading) return;
    setError(null);
    setLoading(true);

    try {
      const result = await authClient.signIn.email({
        email: email.trim().toLowerCase(),
        password,
      });

      if (result?.error) {
        setError('Invalid email or password.');
        return;
      }

      //supposed to work but sometimes had issues so redirect to dashboard in proxy.ts (bugfix)
      router.push('/dashboard');
      router.refresh();
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-neutral-50">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm space-y-4 bg-white p-8 rounded-lg shadow-sm border border-neutral-200"
      >
        <h1 className="text-2xl font-semibold text-neutral-900">Sign in</h1>
        <p className="text-sm text-neutral-600">Sign in to continue reading your novels.</p>

        <div className="space-y-3 pt-2">
          <div className="space-y-1">
            <label htmlFor="email" className="text-sm font-medium text-neutral-700">Email</label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              disabled={loading}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-neutral-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-neutral-900 disabled:bg-neutral-100"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="password" className="text-sm font-medium text-neutral-700">Password</label>
            <input
              id="password"
              type="password"
              required
              autoComplete="current-password"
              disabled={loading}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-neutral-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-neutral-900 disabled:bg-neutral-100"
            />
          </div>
        </div>

        {error && (
          <p role="alert" aria-live="polite" className="text-red-600 text-sm">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          aria-busy={loading}
          className="w-full bg-neutral-900 text-white rounded py-2 text-sm font-medium hover:bg-neutral-800 disabled:opacity-50"
        >
          {loading ? 'Signing in...' : 'Sign in'}
        </button>

        <p className="text-sm text-neutral-600 text-center">
          Don&apos;t have an account?{' '}
          <Link href="/auth/sign-up" className="underline">Sign up</Link>
        </p>
      </form>
    </main>
  );
}

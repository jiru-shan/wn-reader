'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authClient } from '@/app/lib/auth/client';

//read sign-in page.tsx
export default function SignUpPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (loading) return;
    setError(null);

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    if (password.length > 128) {
      setError('Password must be 128 characters or fewer.');
      return;
    }

    setLoading(true);

    try {
      const result = await authClient.signUp.email({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
      });

      if (result?.error) {
        setError('Could not create account. This email may already be registered.');
        return;
      }

      router.push('/dashboard');
      router.refresh();
      //same issue with not redirecting occasionally. solved by proxy.ts but unsure of source
    } catch {
      setError('Could not create account. This email may already be registered.');
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
        <h1 className="text-2xl font-semibold text-neutral-900">Create account</h1>
        <p className="text-sm text-neutral-600">Join wn-reader to start reading.</p>

        <div className="space-y-3 pt-2">
          <div className="space-y-1">
            <label htmlFor="name" className="text-sm font-medium text-neutral-700">Name</label>
            <input
              id="name"
              type="text"
              required
              autoComplete="name"
              disabled={loading}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-neutral-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-neutral-900 disabled:bg-neutral-100"
            />
          </div>

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
              autoComplete="new-password"
              disabled={loading}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-neutral-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-neutral-900 disabled:bg-neutral-100"
            />
            <p className="text-xs text-neutral-500">Must be at least 8 characters.</p>
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
          {loading ? 'Creating account...' : 'Create account'}
        </button>

        <p className="text-sm text-neutral-600 text-center">
          Already have an account?{' '}
          <Link href="/auth/sign-in" className="underline">Sign in</Link>
        </p>
      </form>
    </main>
  );
}

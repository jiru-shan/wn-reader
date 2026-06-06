import { createNeonAuth } from '@neondatabase/auth/next/server';

//auth env variables. neon auth cookie secret generated and added to vercel manually
function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

const cookieSecret = requiredEnv('NEON_AUTH_COOKIE_SECRET');

if (cookieSecret.length < 32) {
  throw new Error('NEON_AUTH_COOKIE_SECRET must be at least 32 characters long');
}

export const auth = createNeonAuth({
  baseUrl: requiredEnv('NEON_AUTH_BASE_URL'),
  cookies: {
    secret: cookieSecret,
  },
});

// src/lib/db/index.ts
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is missing from environment variables');
}

// 1. Establish the Neon HTTP client
const sql = neon(process.env.DATABASE_URL);

// 2. Initialize Drizzle with your schema definitions for full autocomplete safety
export const db = drizzle(sql, { schema });
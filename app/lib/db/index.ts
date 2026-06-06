import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

//database reference for other files

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is missing from environment variables');
}

const sql = neon(process.env.DATABASE_URL);

export const db = drizzle(sql, { schema });
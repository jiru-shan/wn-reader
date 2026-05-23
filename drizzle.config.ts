import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  dialect: 'postgresql',
  schema: './app/lib/db/schema.ts', // Location of your table designs
  out: './drizzle',                 // Where migration files will be generated
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
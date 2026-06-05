// src/lib/db/schema.ts
// src/lib/db/schema.ts
import { pgTable, pgSchema, uuid, serial, text, timestamp, integer, unique } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ==========================================
// 1. NEON AUTH INTERNAL TABLE MAP
// ==========================================
export const neonAuth = pgSchema('neon_auth');

export const usersInNeonAuth = neonAuth.table('user', {
  // ⚡ FIX: Change this from text() to uuid()
  id: uuid('id').primaryKey().notNull(), 
  name: text('name').notNull(),
  email: text('email').unique().notNull(),
});


// ==========================================
// 2. YOUR CUSTOM CORE TABLES
// ==========================================
export const novels = pgTable('novels', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  synopsis: text('synopsis'),
  author: text('author'),
  source: text('source'),
  
  // ⚡ FIX: Change this from text() to uuid() to match Neon Auth
  userId: uuid('user_id')
    .notNull()
    .references(() => usersInNeonAuth.id, { onDelete: 'cascade' }),
    
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const chapters = pgTable('chapters', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  content: text('content').notNull(),
  sortOrder: integer('sort_order').notNull(),
  novelId: integer('novel_id')
    .notNull()
    .references(() => novels.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});


// ==========================================
// 3. BOOKMARK SCHEMA
// ==========================================
export const bookmarks = pgTable('bookmarks', {
  id: serial('id').primaryKey(),
  userId: uuid('user_id').notNull().references(() => usersInNeonAuth.id, { onDelete: 'cascade' }),
  novelId: integer('novel_id').notNull().references(() => novels.id, { onDelete: 'cascade' }),
  chapterId: integer('chapter_id').notNull().references(() => chapters.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),   // ← add this back
  percentage: integer('percentage').notNull().default(0),
  updatedAt: timestamp('updated_at').defaultNow().$onUpdate(() => new Date()).notNull(),
}, (table) => [
  unique('user_novel_bookmark_unique').on(table.userId, table.novelId),
]);

// src/lib/db/schema.ts (Continued)

// src/lib/db/schema.ts

// ... keep your table definitions exactly the same ...

// UPDATE THE RELATIONS CONFIGURATION TO USE EXPLICIT FIELDS/REFERENCES:
export const novelsRelations = relations(novels, ({ one, many }) => ({
  author: one(usersInNeonAuth, {
    fields: [novels.userId],
    references: [usersInNeonAuth.id],
  }),
  chapters: many(chapters),
  bookmarks: many(bookmarks),
}));

export const chaptersRelations = relations(chapters, ({ one, many }) => ({
  novel: one(novels, {
    fields: [chapters.novelId],
    references: [novels.id],
  }),
  bookmarks: many(bookmarks),
}));

export const bookmarksRelations = relations(bookmarks, ({ one }) => ({
  user: one(usersInNeonAuth, {
    fields: [bookmarks.userId],
    references: [usersInNeonAuth.id],
  }),
  novel: one(novels, {
    fields: [bookmarks.novelId],
    references: [novels.id],
  }),
  chapter: one(chapters, {
    fields: [bookmarks.chapterId],
    references: [chapters.id],
  }),
}));
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
// 3. BOOKMARK SCHEMAS
// ==========================================

// User Story #5: Manual Bookmarks (Users can have many per novel)
export const bookmarks = pgTable('bookmarks', {
  id: serial('id').primaryKey(),
  
  userId: uuid('user_id')
    .notNull()
    .references(() => usersInNeonAuth.id, { onDelete: 'cascade' }),
    
  novelId: integer('novel_id')
    .notNull()
    .references(() => novels.id, { onDelete: 'cascade' }),
    
  chapterId: integer('chapter_id')
    .notNull()
    .references(() => chapters.id, { onDelete: 'cascade' }),
    
  percentage: integer('percentage').default(0).notNull(),
  name: text('name').notNull(), 
  updatedAt: timestamp('updated_at').defaultNow().$onUpdate(() => new Date()).notNull(),
}); 
// Note: The unique constraint was removed here so multiple bookmarks can exist per novel

// User Story #10: Autobookmark / Reading Progress (Strictly 1 per novel)
export const readingProgress = pgTable('reading_progress', {
  id: serial('id').primaryKey(),
  
  userId: uuid('user_id')
    .notNull()
    .references(() => usersInNeonAuth.id, { onDelete: 'cascade' }),
    
  novelId: integer('novel_id')
    .notNull()
    .references(() => novels.id, { onDelete: 'cascade' }),
    
  chapterId: integer('chapter_id')
    .notNull()
    .references(() => chapters.id, { onDelete: 'cascade' }),
    
  percentage: integer('percentage').default(0).notNull(),
  updatedAt: timestamp('updated_at').defaultNow().$onUpdate(() => new Date()).notNull(),
}, (table) => [
  unique('user_novel_progress_unique').on(table.userId, table.novelId),
]);

// ==========================================
// 4. RELATIONS
// ==========================================
export const novelsRelations = relations(novels, ({ one, many }) => ({
  author: one(usersInNeonAuth, {
    fields: [novels.userId],
    references: [usersInNeonAuth.id],
  }),
  chapters: many(chapters),
  bookmarks: many(bookmarks),
  readingProgress: many(readingProgress), 
}));

export const chaptersRelations = relations(chapters, ({ one, many }) => ({
  novel: one(novels, {
    fields: [chapters.novelId],
    references: [novels.id],
  }),
  bookmarks: many(bookmarks),
  readingProgress: many(readingProgress), 
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

export const readingProgressRelations = relations(readingProgress, ({ one }) => ({
  user: one(usersInNeonAuth, {
    fields: [readingProgress.userId],
    references: [usersInNeonAuth.id],
  }),
  novel: one(novels, {
    fields: [readingProgress.novelId],
    references: [novels.id],
  }),
  chapter: one(chapters, {
    fields: [readingProgress.chapterId],
    references: [chapters.id],
  }),
}));

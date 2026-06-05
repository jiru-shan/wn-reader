
import { pgTable, pgSchema, uuid, serial, text, timestamp, integer, unique } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const neonAuth = pgSchema('neon_auth');

export const usersInNeonAuth = neonAuth.table('user', {
  id: uuid('id').primaryKey().notNull(), 
  name: text('name').notNull(),
  email: text('email').unique().notNull(),
});



//novels
export const novels = pgTable('novels', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  synopsis: text('synopsis'),
  author: text('author'),
  source: text('source'),
  
  userId: uuid('user_id')
    .notNull()
    .references(() => usersInNeonAuth.id, { onDelete: 'cascade' }),
    
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

//chapters
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


//bookmarks
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


// scraping info
export const scrapingInfo = pgTable('scraping_info', {
  id: serial('id').primaryKey(),
  source: text('source').notNull().unique(),   // URL of the site being scraped
  title: text('title').notNull(),              // CSS class name for title element
  synopsis: text('synopsis'),        // CSS class name for synopsis element
  author: text('author'),            // CSS class name for author element
  chapterTitle: text('chapter_title'),    // CSS class name for chapter title element
  chapterContent: text('chapter_content').notNull(), // CSS class name for chapter content element
});



//relations template for novels (for other relations just copy this structure)
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

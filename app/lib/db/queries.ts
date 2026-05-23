// src/lib/db/queries.ts
import { db } from './index';
import { novels, bookmarks, chapters } from './schema';
import { eq, asc } from 'drizzle-orm';

/**
 * Fetches a user's library dashboard information using their strict UUID identifier
 */
export async function getUserLibraryData(userId: string) {
  // Defensive check to ensure a valid string is passed
  if (!userId || typeof userId !== 'string') {
    throw new Error('A valid User UUID string is required');
  }

  // Concurrently fetch both data sets from Neon
  const [authoredNovels, userBookmarks] = await Promise.all([
    
    // 1. Fetch novels created by this specific UUID user
    db.query.novels.findMany({
      where: eq(novels.userId, userId),
      with: {
        chapters: {
          orderBy: [asc(chapters.sortOrder)],
        },
      },
    }),

    // 2. Fetch all bookmarks saved by this specific UUID user
    db.query.bookmarks.findMany({
      where: eq(bookmarks.userId, userId),
      with: {
        novel: true,
        chapter: true,
      },
    }),
  ]);

  return {
    authoredNovels,
    userBookmarks,
  };
}
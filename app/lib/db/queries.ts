// src/lib/db/queries.ts
import { db } from './index';
import { novels, bookmarks, chapters } from './schema';
import { eq, asc } from 'drizzle-orm';


export async function getUserLibraryData(userId: string) {
  // check to see if id is valid
  if (!userId || typeof userId !== 'string') {
    throw new Error('A valid User UUID string is required');
  }

  // fetch from neon
  const [authoredNovels, userBookmarks] = await Promise.all([
    
    //fetch novels
    db.query.novels.findMany({
      where: eq(novels.userId, userId),
      with: {
        chapters: {
          orderBy: [asc(chapters.sortOrder)],
        },
      },
    }),

    //fetch bookmarks
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

export async function getChapterById(chapterId: number) {
  const chapter = await db.query.chapters.findFirst({
    where: eq(chapters.id, chapterId),
  });
  return chapter;
}
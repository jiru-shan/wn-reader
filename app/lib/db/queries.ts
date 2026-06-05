// src/lib/db/queries.ts
import { db } from './index';
import { novels, bookmarks, chapters } from './schema';
import { eq, and, asc } from 'drizzle-orm';


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

export async function getCollection(userId: string) {
  const collection = await db
    .select()
    .from(novels)
    .where(eq(novels.userId, userId))
    .orderBy(novels.createdAt);
  return collection;
}

export async function getNovelInfo(userId: string, novelId: number) {
  const novelInfo = await db
    .select()
    .from(novels)
    .where(
      and(
        eq(novels.userId, userId),
        eq(novels.id, novelId)
      )
    )
    .limit(1);
  return (novelInfo.length === 1) ? novelInfo[0] : null;
}

export async function getBookmarks(novelId: number) {
  const bookmarksList = await db
    .select()
    .from(bookmarks)
    .where(eq(bookmarks.novelId, novelId));
    // TODO: order by how far they are therough the book
  return bookmarksList;
}

export async function getTableOfContents(novelId: number) {
  const contents = await db
    .select()
    .from(chapters)
    .where(eq(chapters.novelId, novelId))
    .orderBy(chapters.sortOrder);
  return contents;
}

export async function getChapterById(chapterId: number) {
  const chapter = await db.query.chapters.findFirst({
    where: eq(chapters.id, chapterId),
  });
  return chapter;
}

export async function getChaptersForNovel(novelId: number) {
  const allChapters = await db.query.chapters.findMany({
    where: (chapters, { eq }) => eq(chapters.novelId, novelId),
    
    orderBy: (chapters, { asc }) => [asc(chapters.id)], 
  });
  
  return allChapters;
}

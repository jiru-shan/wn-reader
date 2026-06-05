// src/lib/db/queries.ts
import { db } from './index';
import { novels, bookmarks, chapters, readingProgress, scrapingInfo } from './schema';
import { eq, and, asc, desc, sql } from 'drizzle-orm';


export async function getScrapingConfig(url: string) {
  const hostname = new URL(url).hostname;

  const config = await db
    .select()
    .from(scrapingInfo)
    .where(eq(scrapingInfo.source, hostname))
    .limit(1);

  return config.length ? config[0] : null;
}

export async function getReadingProgress(novelId: number) {
  const progress = await db
    .select()
    .from(readingProgress)
    .where(eq(readingProgress.novelId, novelId))
    .innerJoin(chapters, eq(chapters.id, readingProgress.chapterId))
    .limit(1);
  if (progress.length !== 1) {
    return null;
  }
  return progress[0];
}

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
    .orderBy(desc(novels.createdAt));
  return collection;
}

// novelId is a string here to make it so that it's valid to get e.g. /novel/1 but not /novel/01
export async function getNovelInfo(userId: string, novelId: string) {
  const novelInfo = await db
    .select()
    .from(novels)
    .where(
      and(
        eq(novels.userId, userId),
        eq(sql<string>`cast(${novels.id} as varchar)`, novelId)
      )
    )
    .limit(1);
  if (novelInfo.length !== 1) {
    return null;
  }
  return novelInfo[0];
}

export async function getBookmarks(novelId: number) {
  const bookmarksList = await db
    .select()
    .from(bookmarks)
    .where(eq(bookmarks.novelId, novelId))
    .innerJoin(chapters, eq(chapters.id, bookmarks.chapterId))
    .orderBy(asc(chapters.sortOrder), asc(bookmarks.percentage));
  return bookmarksList;
}

export async function getChapters(novelId: number) {
  const chaptersList = await db
    .select()
    .from(chapters)
    .where(eq(chapters.novelId, novelId))
    .orderBy(asc(chapters.sortOrder));
  return chaptersList;
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

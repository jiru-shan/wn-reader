"use server";

import { db } from './index'; 
import { bookmarks, readingProgress, chapters } from './schema';
import { auth } from '@/app/lib/auth/server';
import { and, eq } from 'drizzle-orm';

export async function addManualBookmark(novelId: number, chapterNum: number, percentage: number, name: string) {
  // Extract real identity securely on the backend
  const { data: session } = await auth.getSession();
  const userId = session?.user?.id;

  if (!userId) throw new Error("You must be logged in to bookmark.");

  // Resolve sortOrder (chapterNum) to the true chapterId
  const [chapterRecord] = await db.select()
    .from(chapters)
    .where(and(eq(chapters.novelId, novelId), eq(chapters.sortOrder, chapterNum)))
    .limit(1);

  if (!chapterRecord) throw new Error("Chapter not found.");

  await db.insert(bookmarks).values({
    userId,
    novelId,
    chapterId: chapterRecord.id, 
    percentage,
    name
  });
}

export async function updateAutobookmark(novelId: number, chapterNum: number, percentage: number) {
  const { data: session } = await auth.getSession();
  const userId = session?.user?.id;

  if (!userId) return; // Fail silently if reading logged out

  const [chapterRecord] = await db.select()
    .from(chapters)
    .where(and(eq(chapters.novelId, novelId), eq(chapters.sortOrder, chapterNum)))
    .limit(1);

  if (!chapterRecord) return;

  // Execute atomic upsert
  await db.insert(readingProgress)
    .values({ 
      userId, 
      novelId, 
      chapterId: chapterRecord.id, 
      percentage 
    })
    .onConflictDoUpdate({
      target: [readingProgress.userId, readingProgress.novelId],
      set: { 
        chapterId: chapterRecord.id, 
        percentage, 
        updatedAt: new Date() 
      }
    });
}

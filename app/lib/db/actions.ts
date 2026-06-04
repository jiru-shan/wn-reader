"use server";

import { db } from './index'; // Ensure this points to Drizzle initialization file
import { bookmarks, readingProgress } from './schema';
// Fuli should set up the auth import here later. For now, we have a mock for testing.
// import { auth } from '@neondatabase/auth'; 

// Temporary mock function until Fuli finishes Auth (User Story #4)
async function getUserId() {
  // const session = await auth();
  // return session?.user?.id;
  return "test-user-id-123"; 
}

export async function addManualBookmark(novelId: number, chapterNum: number, percentage: number, name: string) {
  const userId = await getUserId();
  if (!userId) throw new Error("You must be logged in to bookmark.");

  await db.insert(bookmarks).values({
    userId,
    novelId,
    chapterNum,
    percentage,
    name
  });
}

export async function updateAutobookmark(novelId: number, chapterNum: number, percentage: number) {
  const userId = await getUserId();
  if (!userId) return; // Fail silently if reading logged out

  await db.insert(readingProgress)
    .values({ 
      userId, 
      novelId, 
      chapterNum, 
      percentage 
    })
    .onConflictDoUpdate({
      target: [readingProgress.userId, readingProgress.novelId],
      set: { chapterNum, percentage, updatedAt: new Date() }
    });
}

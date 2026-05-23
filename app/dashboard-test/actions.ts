// app/dashboard-test/actions.ts
'use server';

import { db } from '../lib/db';
import { novels, chapters } from '../lib/db/schema';
import { revalidatePath } from 'next/cache';

export interface JSONImportChapter {
  title: string;
  content: string;
  sortOrder: number;
}

// ⚡ Structural Blueprint updated to match your new schema columns
export interface JSONImportNovel {
  title: string;
  synopsis: string | null;
  author: string | null;  // ➕ Added
  source: string | null;  // ➕ Added
  chapters: JSONImportChapter[];
}

export async function importNovelFromJSON(payload: JSONImportNovel, userId: string) {
  if (!payload.title || !userId) {
    throw new Error('Invalid payload formatting or missing account credentials');
  }

  // 1. Step A: Insert the parent novel row directly over HTTP
  const [insertedNovel] = await db.insert(novels)
    .values({
      title: payload.title,
      synopsis: payload.synopsis,
      author: payload.author, // ➕ Added
      source: payload.source, // ➕ Added
      userId: userId,
    })
    .returning({ id: novels.id }); // Capture the auto-generated primary key ID

  // 2. Step B: Bulk insert all chapters tied to that newly created novel ID
  if (payload.chapters && payload.chapters.length > 0) {
    const chaptersToInsert = payload.chapters.map((chap) => ({
      title: chap.title,
      content: chap.content,
      sortOrder: chap.sortOrder,
      novelId: insertedNovel.id, // Safely reference the parent id we just captured above
    }));

    // Send the array as a single bulk operation over the HTTP driver
    await db.insert(chapters).values(chaptersToInsert);
  }

  // 3. Update the Next.js router data cache
  revalidatePath('/dashboard-test');
}
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

export interface JSONImportNovel {
  title: string;
  synopsis: string | null;
  author: string | null;  // ➕ Added
  source: string | null;  // ➕ Added
  chapters: JSONImportChapter[];
}

//test function for importing novel from json (going to have to connect similar func to extension)
export async function importNovelFromJSON(payload: JSONImportNovel, userId: string) {
  if (!payload.title || !userId) {
    throw new Error('Invalid payload formatting or missing account credentials');
  }

  //insert novel into db
  const [insertedNovel] = await db.insert(novels)
    .values({
      title: payload.title,
      synopsis: payload.synopsis,
      author: payload.author, 
      source: payload.source, 
      userId: userId,
    })
    .returning({ id: novels.id });

  //insert chapters into db
  if (payload.chapters && payload.chapters.length > 0) {
    const chaptersToInsert = payload.chapters.map((chap) => ({
      title: chap.title,
      content: chap.content,
      sortOrder: chap.sortOrder,
      novelId: insertedNovel.id, 
    }));

    await db.insert(chapters).values(chaptersToInsert);
  }

  revalidatePath('/dashboard-test');
}
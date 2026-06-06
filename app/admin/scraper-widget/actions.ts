'use server';

import { getScrapingConfig } from '../../lib/db/queries';
import { db } from '../../lib/db';
import { novels, chapters } from '../../lib/db/schema';
import { and, eq } from 'drizzle-orm';
import { auth } from '@/app/lib/auth/server';

export async function fetchScrapingConfig(url: string) {
  try {
    const data = await getScrapingConfig(url);
    return { success: true, data };
  } catch (error) {
    return { success: false, error: 'Failed to fetch config' };
  }
}


type ScrapedChapter = {
  title: string;
  content: string;
};

type SaveScrapedPayload = {
  title: string;
  synopsis?: string;
  author?: string;
  source?: string;
  chapterList: ScrapedChapter[]; // Updated to accept an array
};

export async function saveScrapedData(payload: SaveScrapedPayload) {
  try {
    const { data: session } = await auth.getSession();
    if (!session || !session.user.id) {
      return { success: false, error: 'Unauthorized' };
    }

    let novelId: number;
    
    const existingNovel = await db.query.novels.findFirst({
      where: and(
        eq(novels.title, payload.title),
        eq(novels.userId, session.user.id)
      )
    });

    if (existingNovel) {
      novelId = existingNovel.id;
    } else {
      const [newNovel] = await db.insert(novels).values({
        title: payload.title,
        synopsis: payload.synopsis || '',
        author: payload.author || 'Unknown',
        source: payload.source || '',
        userId: session.user.id,
      }).returning({ id: novels.id });
      
      novelId = newNovel.id;
    }

   const existingChapters = await db.query.chapters.findMany({
      where: eq(chapters.novelId, novelId),
    });
    let currentSortOrder = existingChapters.length;

    const chaptersToInsert = payload.chapterList.map((ch) => {
      currentSortOrder += 1;
      return {
        title: ch.title || 'Untitled Chapter',
        content: ch.content || '',
        sortOrder: currentSortOrder,
        novelId: novelId,
      };
    });

    const insertedChapters = await db.insert(chapters)
      .values(chaptersToInsert)
      .returning({ id: chapters.id });

    return { 
      success: true, 
      data: { 
        novelId, 
        chaptersSaved: insertedChapters.length 
      } 
    };

  } catch (error: unknown) {
    console.error("Failed to save scraped data:", error);
    
    const errorMessage = error instanceof Error ? error.message : 'Database error';
    return { success: false, error: errorMessage };
  }
}
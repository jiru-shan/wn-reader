'use server'; // This forces the code to run ONLY on the server

import { getScrapingConfig } from '../../lib/db/queries';
import { db } from '../../lib/db'; // Path to your drizzle db instance
import { novels, chapters } from '../../lib/db/schema'; // Path to your schema
import { and, eq } from 'drizzle-orm';
// Assuming you have a way to get the current user session (e.g., Next-Auth, Kinde, Clerk, Neon Auth)
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
    // 1. Authenticate user (Novels require a userId in your schema)
    const { data: session } = await auth.getSession();
    if (!session || !session.user.id) {
      return { success: false, error: 'Unauthorized' };
    }

    // 2. Find or Create the Novel
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

    // 4. Map the array to match your Drizzle schema and insert them all at once
    const chaptersToInsert = payload.chapterList.map((ch) => {
      currentSortOrder += 1;
      return {
        title: ch.title || 'Untitled Chapter',
        content: ch.content || '',
        sortOrder: currentSortOrder,
        novelId: novelId,
      };
    });

    // Bulk insert for high performance
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

  } catch (error: unknown) { // Changed 'any' to 'unknown'
    console.error("Failed to save scraped data:", error);
    
    // Safely extract the message from the unknown error
    const errorMessage = error instanceof Error ? error.message : 'Database error';
    return { success: false, error: errorMessage };
  }
}
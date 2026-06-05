import { NextResponse } from "next/server";
import { db } from "@/app/lib/db";
import { bookmarks } from "@/app/lib/db/schema";
import { eq, and, ne } from "drizzle-orm";
import { auth } from "@/app/lib/auth/server";

export async function POST(request: Request) {
  try {
    const sessionContext = await auth.getSession();
    if (!sessionContext?.data?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = sessionContext.data.user.id;
    
    // 1. Pull the new isAuto flag from the client
    const { novelId, chapterId, percentage, chapterTitle, isAuto } = await request.json();

    if (!chapterId || !novelId) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 });
    }

    // 2. Use a distinct hidden name if it's an background auto-save
    const bookmarkName = isAuto ? "__auto_progress__" : (chapterTitle || `Chapter ${chapterId}`);

    // 3. Query explicitly for the right type of bookmark (Auto vs Manual slot)
    const existing = await db
      .select()
      .from(bookmarks)
      .where(
        and(
          eq(bookmarks.userId, userId),
          eq(bookmarks.novelId, novelId),
          isAuto 
            ? eq(bookmarks.name, "__auto_progress__")
            : ne(bookmarks.name, "__auto_progress__") // Keeps manual slots safe
        )
      )
      .limit(1);

    if (existing.length > 0) {
      await db
        .update(bookmarks)
        .set({ chapterId, percentage, name: bookmarkName, updatedAt: new Date() })
        .where(eq(bookmarks.id, existing[0].id));
    } else {
      await db.insert(bookmarks).values({
        userId, novelId, chapterId, percentage, name: bookmarkName, updatedAt: new Date(),
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Bookmark Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
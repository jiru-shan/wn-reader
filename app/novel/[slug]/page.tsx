import { notFound } from 'next/navigation';
import Link from 'next/link';

import { auth } from '@/app/lib/auth/server';
import { getNovelInfo, getBookmarks, getChapters } from '@/app/lib/db/queries';

function BookmarksSection({
  novelId, bookmarks
}: {
  novelId: number,
  bookmarks: {
    bookmarks: {
      id: number,
      name: string,
      percentage: number
    }
    chapters: {
      id: number,
      sortOrder: number
    }
  }[]
}) {
  if (bookmarks.length === 0) {
    return <></>
  }

  // TODO: "continue where you left off" button, linking to ReadingProgress
  return (
    <>
      <h2 className="text-2xl font-semibold mt-2">Bookmarks</h2>
      <ul>
        {
          bookmarks.map(bkmk =>
            // TODO: replace sortOrder with chapter number
            <li key={bkmk.bookmarks.id} className="indent-8">
              <Link href={`/novel/${novelId}/${bkmk.chapters.id}/${bkmk.bookmarks.percentage}`} className="hover:underline">
                <span className="italic">{bkmk.bookmarks.name}</span>&nbsp;&ndash;&nbsp;Chapter {bkmk.chapters.sortOrder}
              </Link>
            </li>
            // TODO: how to visually distinguish the chapter number part from the bookmark name?
          )
        }
      </ul>
    </>
  );
}

function ContentsSection({
  novelId, chapters
}: {
  novelId: number,
  chapters: {
    id: number,
    title: string
  }[]
}) {
  return (
    <>
        <h2 className="text-2xl font-semibold mt-2">Chapters</h2>
        <ul className="indent-8">
          {chapters.map(chapter =>
            <li key={chapter.id}>
              <Link href={`/novel/${novelId}/${chapter.id}`} className="hover:underline">
                {chapter.title}
              </Link>
            </li>
          )}
        </ul>
        </>
  );
}
export default async function TocPage({
  params
}: {
  params: Promise<{ slug: string }> // Fixed to match your folder name '[slug]'
}) {
  // 1. Fetch session and cast as any to bypass strict type definition mismatches
  const sessionContext = await auth.getSession() as any;

  // 2. Safely extract user whether it is nested or on the top level
  const user = sessionContext?.data?.user || sessionContext?.user || sessionContext?.data;

  // 3. Prevent crashes if session context is missing or logged out
  if (!user || !user.id) {
    notFound();
  }

  // 4. Await parameters and extract 'slug' (which holds your novel ID number)
  const { slug } = await params;
  const novelId = Number(slug);

  if (isNaN(novelId)) {
    notFound();
  }

  // 5. Fetch layout details using safe keys
  const novelInfo = await getNovelInfo(user.id, slug);
  if (novelInfo === null) {
    notFound();
  }

  const bookmarks = await getBookmarks(novelId);
  const chapters = await getChapters(novelId);

  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-white font-sans dark:bg-black">
      <main className="flex flex-1 w-full max-w-3xl flex-col py-16 px-16 bg-white dark:bg-black">
        <h1 className="text-3xl font-semibold leading-10 tracking-tight text-black dark:text-zinc-50">
          {novelInfo.title}
        </h1>
        <p>
          Author: {novelInfo.author ? novelInfo.author : <em>(none listed)</em>}
        </p>
        <p>
          Original URL: {novelInfo.source ? <a href={novelInfo.source} rel="external" className="hover:underline">{novelInfo.source}</a> : <em>(none listed)</em>}
        </p>
        <p>
          Date added: {novelInfo.createdAt.toLocaleDateString()}
        </p>
        <p className="italic indent-8 mt-2">
          {novelInfo.synopsis}
        </p>
        <BookmarksSection novelId={novelId} bookmarks={bookmarks} />
        <ContentsSection novelId={novelId} chapters={chapters} />
      </main>
    </div>
  );
}
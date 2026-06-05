import { notFound } from 'next/navigation';
import Link from 'next/link';

import { auth } from '@/app/lib/auth/server';
import { getNovelInfo, getBookmarks, getChapters, getReadingProgress } from '@/app/lib/db/queries';

function ReadingProgressSection({
  novelId, readingProgress
}: {
  novelId: number,
  readingProgress: {
    reading_progress: {
      percentage: number
    },
    chapters: {
      sortOrder: number
    }
  } | null
}) {
  if (readingProgress === null) {
    return <></>;
  }

  return (
    <p className="text-lg font-semibold text-center mt-2">
      <Link href={`/novel/${novelId}/${readingProgress.reading_progress.percentage}`} className="hover:underline">
        Continue where you left off (Chapter&nbsp;{readingProgress.chapters.sortOrder})
      </Link>
    </p>
  );
}

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

  return (
    <>
      <h2 className="text-2xl font-semibold mt-2">Bookmarks</h2>
      <ul>
        {
          bookmarks.map(bkmk =>
            <li key={bkmk.bookmarks.id} className="indent-8">
              <Link href={`/novel/${novelId}/${bkmk.chapters.id}/${bkmk.bookmarks.percentage}`} className="hover:underline">
                <span className="italic">{bkmk.bookmarks.name}</span>&nbsp;&ndash;&nbsp;Chapter&nbsp;{bkmk.chapters.sortOrder}
              </Link>
            </li>
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
  params: Promise<{ slug: string }>
}) {
  const { data: session } = await auth.getSession();
  if (session === null) {
    notFound();
  }

  const { slug } = await params;
  const novelId = Number(slug);
  const novelInfo = await getNovelInfo(session.user.id, slug);
  if (novelInfo === null) {
    notFound();
  }

  const readingProgress = await getReadingProgress(novelId);
  const bookmarks = await getBookmarks(novelId);
  const chapters = await getChapters(novelId);

  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-white font-sans dark:bg-black">
      <main className="flex flex-1 w-full max-w-3xl flex-col py-16 px-16 bg-white dark:bg-black">
        <Link href="/dashboard" className="mb-6 text-sm hover:underline w-fit">
          &larr; Back to Dashboard
        </Link>
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
        <ReadingProgressSection novelId={novelId} readingProgress={readingProgress} />
        <BookmarksSection novelId={novelId} bookmarks={bookmarks} />
        <ContentsSection novelId={novelId} chapters={chapters} />
      </main>
    </div>
  );
}
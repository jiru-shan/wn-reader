import Link from 'next/link';

import { auth } from '@/app/lib/auth/server';
import { getNovelInfo, getTableOfContents } from '@/app/lib/db/queries';

export default async function TocPage({
  params
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params;
  const { data: session } = await auth.getSession();
  // TODO: how to handle this properly?
  if (session === null) {
    return <></>;
  }
  const novelId = Number(slug);
  const novelInfo = await getNovelInfo(session.user.id, novelId);
  if (novelInfo === null) {
    return <></>;
  }
  const contents = await getTableOfContents(novelId);

  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-white font-sans dark:bg-black">
      <main className="flex flex-1 w-full max-w-3xl flex-col py-32 px-16 bg-white dark:bg-black">
        <h1 className="text-3xl font-semibold leading-10 tracking-tight text-black dark:text-zinc-50">
          {novelInfo.title}
        </h1>
        <p>
          Author: {novelInfo.author ? novelInfo.author : <em>(none listed)</em>} {/* TODO: is there a shorter way to do this? */}
        </p>
        <p>
          {/* TODO: how should it display when the URL is very long? */}
          {/* TODO: link styling */}
          Original URL: {novelInfo.source ? <a href={novelInfo.source} rel="external">{novelInfo.source}</a> : <em>(none listed)</em>} {/* TODO: format as external link */}
        </p>
        {/* TODO: use novelInfo.createdAt */}
        <p>
          {/* TODO: style this in some way to make it clear that it's part of the text, rather than from this app */}
          {/* TODO: what to do if there's no synopsis? */}
          <em>{novelInfo.synopsis}</em>
        </p>
        <h2 className="text-2xl font-semibold mt-2">Bookmarks</h2>
        <ul>
          {/* TODO */}
          <li>&lt;bookmark name&gt;&nbsp;&ndash;&nbsp;Chapter &lt;number&gt;</li> {/* TODO: how to visually distinguish the chapter # part from the bookmark name? */}
        </ul>
        {/* TODO: gap before the "Chapters" section */}
        <h2 className="text-2xl font-semibold mt-2">Chapters</h2>
        <ul>
          {contents.map(chapter =>
            // TODO: use sort_order
            <li key={chapter.id}>
              <Link href={`/novel/${novelId}/${chapter.id}`}>
                {chapter.title}
              </Link>
            </li>
          )}
        </ul>
      </main>
    </div>
  );
}

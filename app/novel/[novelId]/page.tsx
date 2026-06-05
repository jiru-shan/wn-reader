import Link from 'next/link';

import { auth } from '@/app/lib/auth/server';
import { getNovelInfo, getTableOfContents } from '@/app/lib/db/queries';

export default async function TocPage({
  params
}: {
  params: Promise<{ novelId: string }>
}) {
  const { novelId: urlNovelId } = await params; 
  const { data: session } = await auth.getSession();
  
  if (session === null) {
    return <></>;
  }
  
  const novelId = Number(urlNovelId); 
  const novelInfo = await getNovelInfo(session.user.id, novelId);
  
  if (novelInfo === null) {
    return <></>;
  }
  const contents = await getTableOfContents(novelId);

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
          Original URL: {novelInfo.source ? <a href={novelInfo.source} rel="external">{novelInfo.source}</a> : <em>(none listed)</em>}
        </p>
        <p>
          <em>{novelInfo.synopsis}</em>
        </p>
        <h2 className="text-2xl font-semibold mt-2">Bookmarks</h2>
        <ul>
          <li>&lt;bookmark name&gt;&nbsp;&ndash;&nbsp;Chapter &lt;number&gt;</li> 
        </ul>
        <h2 className="text-2xl font-semibold mt-2">Chapters</h2>
        <ul>
          {contents.map(chapter =>
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

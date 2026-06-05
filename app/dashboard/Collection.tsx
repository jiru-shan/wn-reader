'use client'

import Link from 'next/link';

function Card({
  novel
}: {
  novel: {
    id: number,
    title: string,
    author: string | null,
    synopsis: string | null
  }
}) {
  return (
    <li className="h-64 sm:h-48 outline-2 p-2 rounded-xl overflow-hidden">
      <h2 className="line-clamp-3 sm:line-clamp-2 text-2xl font-semibold"><Link href={`/novel/${novel.id}`} className="hover:underline">{novel.title}</Link></h2>
      {novel.author ? <p className="line-clamp-1"><em>by {novel.author}</em></p> : null}
      <p className="line-clamp-8 sm:line-clamp-5">{novel.synopsis}</p>
    </li>
  );
}

export default function Collection({
  collection
}: {
  collection: {
    id: number,
    title: string,
    author: string | null,
    synopsis: string | null
  }[]
}) {
  if (collection.length === 0) {
    return (
      <>
        <p className="mb-4">Your collection is currently empty.</p>
        <Link href="/scrape" className="text-sm font-medium bg-neutral-900 text-white px-4 py-2 rounded hover:bg-neutral-800 inline-block">
          Scrape and Save
        </Link>
      </>
    );
  }

  return (
    <>
      <div className="mb-4">
        <Link href="/scrape" className="text-sm font-medium bg-neutral-900 text-white px-4 py-2 rounded hover:bg-neutral-800 inline-block">
          Scrape and Save
        </Link>
      </div>
      <ul className="flex flex-col gap-4">
        {collection.map(novel => <Card novel={novel} key={novel.id} />)}
      </ul>
    </>
  );
}
'use client'

import Link from 'next/link';

function SearchBar({ setQuery }: { setQuery: (query: string) => void }) {
  function handleSearchBarChange(e: React.ChangeEvent<HTMLInputElement>) {
    setQuery(e.target.value);
  }

  return (
    <form className="mb-2">
      <label htmlFor="search-collection">Search your novels:</label>
      &nbsp;
      <input 
        type="search" 
        id="search-collection" 
        className="outline focus:outline-2 focus:outline-sky-300" 
        onChange={handleSearchBarChange} 
      />
    </form>
  );
}

function matches(novel: {
  title: string,
  author: string | null,
  synopsis: string | null
}, query: string): boolean {
  return (
    novel.title.toLowerCase().includes(query.toLowerCase())
      || (novel.author !== null && novel.author.toLowerCase().includes(query.toLowerCase()))
      || (novel.synopsis !== null && novel.synopsis.toLowerCase().includes(query.toLowerCase()))
  );
}

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
      </>
    );
  }

  return (
    <>
      <ul className="flex flex-col gap-4">
        {collection.map(novel => <Card novel={novel} key={novel.id} />)}
      </ul>
    </>
  );
}
'use client'

import { useState } from 'react';
import Link from 'next/link';

//serach bar on dashboard page
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

//cards for individual novels on the dashboard page
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
  const [query, setQuery] = useState('');

  if (collection.length === 0) {
    return (
      <p>Your collection is currently empty. Enter a link to the TOC of a novel of a registered site.</p>
    );
  }

  const filteredCollection = collection.filter(novel => matches(novel, query));

  return (
    <>
      <SearchBar setQuery={setQuery} />
      <ul className="flex flex-col gap-4">
        {
          (filteredCollection.length > 0) ? filteredCollection.map(novel => <Card novel={novel} key={novel.id} />) : <p>None of the novels in your collection match your search query.</p>
        }
      </ul>
    </>
  );
}

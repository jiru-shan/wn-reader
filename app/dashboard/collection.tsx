'use client'

import { useState } from 'react';
import Link from 'next/link';

function SearchBar({ setQuery }) {
  function handleSearchBarChange(e) {
    setQuery(e.target.value);
  }

  return (
    <form className="mb-2">
      <label htmlFor="search-collection">Search novels:</label>
      &nbsp;
      <input type="search" id="search-collection" className="border" onChange={handleSearchBarChange} />
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

function Card(novel: {
  id: number,
  title: string,
  author: string | null,
  synopsis: string | null
}) {
  return (
    <li className="h-64 sm:h-48 outline-2 p-2 rounded-xl overflow-hidden" key={novel.id}>
      <h2 className="line-clamp-3 sm:line-clamp-2 text-2xl font-semibold"><Link href={`/novel/${novel.id}`}>{novel.title}</Link></h2>
      {novel.author ? <p className="line-clamp-1"><em>by {novel.author}</em></p> : null}
      <p className="line-clamp-8 sm:line-clamp-5">{novel.synopsis}</p>
    </li>
  );
}

export default function Collection({ collection }) {
  const [query, setQuery] = useState('');

  return (
    <>
      <SearchBar setQuery={setQuery} />
      <ul className="flex flex-col gap-4">
        {
          collection
            .filter(novel => matches(novel, query))
            .map(Card)
        }
      </ul>
    </>
  );
}

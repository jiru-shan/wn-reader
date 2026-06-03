'use client'

import { useState } from 'react';
import Link from 'next/link';

function SearchBar({ setQuery }) {
  function handleSearchBarChange(e) {
    setQuery(e.target.value);
  }

  return (
    <form className="mb-2">
      <label htmlFor="search-collection">Search your collection:</label>
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
    <li className="outline-2 p-2 rounded-xl" key={novel.id}>
      <h2 className="text-2xl font-semibold"><Link href={`/novel/${novel.id}`}>{novel.title}</Link></h2>
        {novel.author ? <p>by {novel.author}</p> : null}
        <p>{novel.synopsis}</p>
    </li>
  );
}

export default function Collection({ collection }) {
  const [query, setQuery] = useState('');

  return (
    <>
      <SearchBar setQuery={setQuery} />
      <ul className="grid grid-cols-1 justify-between justify-items-stretch items-stretch gap-4 w-full">
        {
          collection
            .filter(novel => matches(novel, query))
            .map(Card)
        }
      </ul>
    </>
  );
}

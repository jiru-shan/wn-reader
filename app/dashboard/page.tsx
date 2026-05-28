import Link from 'next/link';

import { neon } from '@neondatabase/serverless';

async function getData() {
  const sql = neon(process.env.DATABASE_URL);
  const response = await sql`SELECT * FROM novels`; // tables: novels, chapters
  return response;
}

/*
export default async function Page() {
  const data = await getData();
  console.log(data);
  return <p>hello</p>
  //return <>{data}</>;
}
*/

export default async function DashboardPage() {
  // TODO: do this properly (useEffect?)
  // TODO: type
  // TODO: cover image
  // TODO: maybe don't require using the database ID?
  // later TODO: pagination
  const collection = await getData();
  /*
  const collection = [
    {
      id: 0,
      title: "Title",
      author: "Author",
      synopsis: "Synopsis",
      url: "https://example.com/",
      chapters: [
        {
          title: "Chapter 1",
        },
        {
          title: "Chapter 2",
        },
      ],
    },
    {
      id: 1,
      title: "Book 2",
      author: "Another author",
      synopsis: "This is a super cool book.",
      url: "https://example.com/2",
      chapters: [
        {
          title: "Another chapter",
        },
      ],
    },
    {
      id: 2,
      title: "This is a somewhat long title, for testing purposes",
      //title: "Short title",
      author: "No one knows",
      synopsis: "Hello",
      url: "https://example.com/3",
      chapters: [
        {
          title: "The title of this chapter should also be very long",
        },
      ],
    },
  ];
  */

  return ( 
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex flex-1 w-full max-w-3xl flex-col items-center py-32 px-16 bg-white dark:bg-black sm:items-start">
        {/*<div className="flex flex-col items-center gap-6 text-center sm:items-start sm:text-left w-full">*/}
          {/* TODO: bigger margin after the h1 */}
          <h1 className="max-w-xs text-3xl font-semibold leading-10 tracking-tight text-black dark:text-zinc-50 mb-2">
            Your collection
          </h1>
          {/* TODO: styling for the ul below */}
          <ul className="grid grid-cols-1 sm:grid-cols-2 justify-between justify-items-stretch items-stretch gap-4 w-full"> {/* TODO: make it 1 column on small screens */}
            {
              collection.map(novel =>
                // TODO: support clicking on it to see the table of contents
                // TODO: consistent heights?
                // TODO: routing
                // in TOC, have /novel/<id>/<chapter id>
                <Link href={`/novel/${novel.id}`} key={novel.id}>
                {/* TODO: make the outline appear in light mode as well */}
                <li className="outline-2 outline-white p-2 rounded-xl"> {/* TODO: actually make it look good (also make it work in light mode) */}
                  <h2 className="text-2xl font-semibold">{novel.title}</h2>
                  <p>by {novel.author}</p> {/* TODO: don't display if no author */}
                  <p>{novel.synopsis}</p> {/* TODO: clip the synopsis to a certain length */}
                  {/*<button>Table of contents</button>*/} {/* TODO: TOC page should include more info, and also have a link to view the page */}
                  {/* or, make the entire card a button */}
                </li>
                </Link>
                // TODO: make it so that only the part displayed in the border is clickable
              )
            }
          </ul>
          {/*
          <p className="max-w-md text-lg leading-8 text-zinc-600 dark:text-zinc-400">
            Some text.
          </p>
          */}
        {/*</div>*/}
      </main>
    </div>
  );
}

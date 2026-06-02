import Link from 'next/link';

import { db } from '@/app/lib/db/index';
import { novels } from '@/app/lib/db/schema';

async function getCollection() {
  const collection = await db
    .select()
    .from(novels);
  return collection;
}

export default async function DashboardPage() {
  const collection = await getCollection();

  return ( 
    <div className="flex flex-col flex-1 items-center justify-center bg-white font-sans dark:bg-black">
      <main className="flex flex-1 w-full max-w-3xl flex-col py-32 px-16 bg-white dark:bg-black">
        <h1 className="text-3xl font-semibold leading-10 tracking-tight text-black dark:text-zinc-50 mb-2">
          Your collection
        </h1>
        <ul className="grid grid-cols-1 justify-between justify-items-stretch items-stretch gap-4 w-full">
          {
            collection.map(novel => (
              <li className="outline-2 outline-black dark:outline-white p-2 rounded-xl" key={novel.id}>
                <h2 className="text-2xl font-semibold"><Link href={`/novel/${novel.id}`}>{novel.title}</Link></h2>
                  {novel.author ? <p>by {novel.author}</p> : null}
                  <p>{novel.synopsis}</p>
              </li>
            ))
          }
        </ul>
      </main>
    </div>
  );
}

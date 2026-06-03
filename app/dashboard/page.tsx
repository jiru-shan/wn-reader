import { db } from '@/app/lib/db/index';
import { novels } from '@/app/lib/db/schema';
import Collection from '@/app/dashboard/collection';

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
        <Collection collection={collection} />
      </main>
    </div>
  );
}

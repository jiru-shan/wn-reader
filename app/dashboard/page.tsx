import { notFound } from 'next/navigation';
import { auth } from '@/app/lib/auth/server';
import { getCollection } from '@/app/lib/db/queries';
import Collection from '@/app/dashboard/Collection';
import Scraper from '@/app/dashboard/Scraper'; 



export default async function DashboardPage() {
  const { data: session } = await auth.getSession();
  if (session === null) notFound();

  const collection = await getCollection(session.user.id);

  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-white font-sans dark:bg-black">
      <main className="flex flex-1 w-full max-w-3xl flex-col py-16 px-16 bg-white dark:bg-black">
        <h1 className="text-3xl font-semibold leading-10 tracking-tight text-black dark:text-zinc-50">
          Your collection
        </h1>
        
        {/* Render it directly here */}
        <Scraper />
        
        <Collection collection={collection} />
      </main>
    </div>
  );
}

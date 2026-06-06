import ReaderUI from "./ReaderUI";
import { getChaptersForNovel } from "@/app/lib/db/queries"; 

//wait for chapters and params to load before loading readerUI (pass in everything as props)
export default async function ReaderPage({ 
  params 
}: { 
  params: Promise<{ slug: string; readParams: string[] }> 
}) {
  const resolvedParams = await params;
  const currentNovelId = Number(resolvedParams.slug);

  if (isNaN(currentNovelId)) {
    return (
      <main className="p-8">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Invalid Novel ID</h1>
      </main>
    );
  }
 
  const chapterList = await getChaptersForNovel(currentNovelId);

  if (!chapterList || chapterList.length === 0) {
    return (
      <main className="p-8">
        <h1 className="text-2xl font-bold text-amber-600 mb-4">No Chapters Found</h1>
      </main>
    );
  }
  let initialChapterIndex = 0;
  let initialPercentage = 0; 

  if (resolvedParams.readParams && resolvedParams.readParams.length > 0) {
    const requestedChapterId = Number(resolvedParams.readParams[0]);
    if (!isNaN(requestedChapterId)) {
      const foundIdx = chapterList.findIndex(ch => ch.id === requestedChapterId);
      if (foundIdx !== -1) {
        initialChapterIndex = foundIdx;
      }
    }

    if (resolvedParams.readParams.length > 1) {
      const requestedPercentage = Number(resolvedParams.readParams[1]);
      if (!isNaN(requestedPercentage)) {
        initialPercentage = Math.max(0, Math.min(100, requestedPercentage));
      }
    }
  }

  return (
    <ReaderUI 
      chapters={chapterList} 
      novelId={currentNovelId}
      initialIndex={initialChapterIndex} 
      initialPercentage={initialPercentage} 
    />
  );
}
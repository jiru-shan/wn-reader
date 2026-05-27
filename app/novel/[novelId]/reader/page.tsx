import ReaderUI from "./ReaderUI";
import { getChaptersForNovel } from "../../../lib/db/queries"; 

// 1. Update the type to expect a Promise
export default async function ReaderPage({ params }: { params: Promise<{ novelId: string }> }) {
  
  // 2. AWAIT the params before reading them!
  const resolvedParams = await params;
  const currentNovelId = Number(resolvedParams.novelId);

  const chapterList = await getChaptersForNovel(currentNovelId);

  if (!chapterList || chapterList.length === 0) {
    return (
      <main className="p-8">
        <h1 className="text-2xl font-bold text-red-600 mb-4">No Chapters Found</h1>
        <p>This novel (ID: {currentNovelId}) doesn't have any chapters published yet.</p>
      </main>
    );
  }

  return <ReaderUI chapters={chapterList} />;
}
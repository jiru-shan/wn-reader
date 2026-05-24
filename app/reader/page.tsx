// app/reader/page.tsx
import ReaderUI from "./ReaderUI";
import { getChapterById } from "../lib/db/queries";

// hardcoded for chapter 1 currently
export default async function ReaderPage() {
  const myChapter = await getChapterById(1);

  if (!myChapter) {
    return (
      <main className="p-8">
        <h1 className="text-2xl font-bold text-red-600 mb-4">No Chapter Found</h1>
        <p>no chapter with ID 1 yet.</p>
      </main>
    );
  }

  // 3. Pass the data into your interactive component!
  return <ReaderUI title={myChapter.title} content={myChapter.content} />;
}
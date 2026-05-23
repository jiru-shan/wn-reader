// src/app/dashboard/page.tsx
import { getUserLibraryData } from '../lib/db/queries';
import JSONImporter from './JSONImporter';

// Hypothetical session getter from Neon Auth or your auth system
async function getAuthenticatedUser() {
  // Replace this with your actual auth extraction logic (e.g., authClient.getSession())
  // Initialized with a structurally sound standard v4 UUID fallback string layout
  return { 
    id: "91c632b2-65a9-4278-a16a-743f57288317", 
    name: "Matthew" 
  };
}

export default async function DashboardPage() {
  const user = await getAuthenticatedUser();
  
  // Fetch active operational parameters safely bound to the user's explicit UUID
  const { authoredNovels, userBookmarks } = await getUserLibraryData(user.id);

  return (
    <main className="max-w-5xl mx-auto p-8 space-y-12">
      
      {/* HEADER SECTION */}
      <header className="border-b pb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Welcome back, {user.name}</h1>
          <p className="text-slate-500">Manage your writing projects and reading progression.</p>
        </div>
        
        {/* DATA UTILITY PORTAL */}
        <div className="w-full md:w-auto md:min-w-[400px]">
          <JSONImporter userId={user.id} />
        </div>
      </header>

      {/* TWO-COLUMN GRID MONITOR */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* LEFT COLUMN: AUTHORED NOVELS */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-slate-800">Your Novels ({authoredNovels.length})</h2>
          
          {authoredNovels.length === 0 ? (
            <div className="border border-dashed p-8 rounded-2xl text-center bg-white">
              <p className="text-slate-400 italic text-sm">You haven&apos;t written any novels yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {authoredNovels.map((novel) => (
                <div key={novel.id} className="border p-5 rounded-xl bg-white shadow-sm space-y-3">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">{novel.title}</h3>
                    <p className="text-sm text-slate-600 line-clamp-2">{novel.synopsis}</p>
                  </div>
                  
                  {/* Nested Chapters Sub-List */}
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                      Chapters ({novel.chapters.length})
                    </h4>
                    {novel.chapters.length === 0 ? (
                      <p className="text-xs text-slate-400 italic">No chapters created yet.</p>
                    ) : (
                      <ul className="text-sm text-slate-700 divide-y divide-slate-200">
                        {novel.chapters.map((chap) => (
                          <li key={chap.id} className="py-1.5 flex justify-between">
                            <span>{chap.title}</span>
                            <span className="text-xs text-slate-400">Idx: {chap.sortOrder}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* RIGHT COLUMN: READING BOOKMARKS */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-slate-800">Reading Progress</h2>
          
          {userBookmarks.length === 0 ? (
            <div className="border border-dashed p-8 rounded-2xl text-center bg-white">
              <p className="text-slate-400 italic text-sm">Your reading list is empty. Bookmark a chapter to begin.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {userBookmarks.map((bookmark) => (
                <div key={bookmark.id} className="border p-4 rounded-xl bg-slate-50 hover:bg-slate-100/50 transition flex justify-between items-center">
                  <div>
                    <h3 className="font-semibold text-slate-900">{bookmark.novel.title}</h3>
                    <p className="text-sm text-blue-600 font-medium">
                      Currently on: {bookmark.chapter.title}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="inline-block bg-blue-50 text-blue-700 border border-blue-100 text-xs font-bold px-2.5 py-1 rounded-full">
                      Ch. {bookmark.chapter.sortOrder}
                    </span>
                    <p className="text-[10px] text-slate-400 mt-1">
                      Saved {new Date(bookmark.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

      </div>
    </main>
  );
}
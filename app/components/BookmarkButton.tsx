"use client";

import { useParams } from 'next/navigation';
import { addManualBookmark } from '@/app/lib/db/actions';
import { useState } from 'react';

//Bookmark component in the reader
export default function BookmarkButton() {
  const params = useParams(); 
  const [isSaving, setIsSaving] = useState(false);

  const novelId = Number(params.novelId);
  const chapterNum = Number(params.chapterNum);
  const percentage = Number(params.percentage);

  const handleBookmark = async () => {
    if (isNaN(novelId) || isNaN(chapterNum) || isNaN(percentage)) {
      alert("Cannot bookmark: Invalid URL parameters.");
      return;
    }

    setIsSaving(true);
    try {
      const bookmarkName = `Chapter ${chapterNum}`;
      //server side actions.ts file 
      await addManualBookmark(novelId, chapterNum, percentage, bookmarkName);
      alert("Bookmark saved!");
    } catch (error) {
      console.error("Failed to bookmark", error);
      alert("Failed to save bookmark. Are you logged in?");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <button 
      onClick={handleBookmark} 
      disabled={isSaving}
      className="px-4 py-2 bg-stone-800 text-white rounded hover:bg-stone-700 disabled:opacity-50 font-bold transition-colors"
    >
      {isSaving ? "Saving..." : "Bookmark this page"}
    </button>
  );
}

"use client";

import { useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { updateAutobookmark } from '@/app/lib/db/actions';

export default function AutoBookmarkTracker() {
  const params = useParams();
  
  // Use refs to ensure the cleanup function always has the absolute latest URL values
  const novelId = useRef(Number(params.novelId));
  const chapterNum = useRef(Number(params.chapterNum));
  const percentage = useRef(Number(params.percentage));

  useEffect(() => {
    novelId.current = Number(params.novelId);
    chapterNum.current = Number(params.chapterNum);
    percentage.current = Number(params.percentage);
  }, [params]);

  useEffect(() => {
    // Triggers ONLY when the user unmounts/leaves the reader page
    return () => {
      const nId = novelId.current;
      const cNum = chapterNum.current;
      const pct = percentage.current;

      if (!isNaN(nId) && !isNaN(cNum) && !isNaN(pct)) {
        updateAutobookmark(nId, cNum, pct).catch(console.error);
      }
    };
  }, []);

  return null; // Runs invisibly in the background
}

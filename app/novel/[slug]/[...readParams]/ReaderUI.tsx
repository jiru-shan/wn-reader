"use client";
import { useState, useRef, useEffect } from "react";
import Link from "next/link"; // Added for routing

interface Chapter {
  id: number;
  title: string;
  content: string;
}

interface ReaderUIProps {
  chapters: Chapter[];
  novelId: number;
  initialIndex?: number;
  initialPercentage?: number;
}

export default function ReaderUI({ chapters, novelId, initialIndex = 0, initialPercentage = 0 }: ReaderUIProps) {
  const [isMounted, setIsMounted] = useState(false);
  const hasInitializedProgress = useRef(false); 

  const [bookmarkStatus, setBookmarkStatus] = useState<"idle" | "loading" | "saved">("idle");

  const [fontSize, setFontSize] = useState(18);
  const [theme, setTheme] = useState<"light" | "dark" | "sepia">("dark");
  const [fontFamily, setFontFamily] = useState("font-serif");
  const [widthLevel, setWidthLevel] = useState(3);
  const [layout, setLayout] = useState<"scroll" | "single" | "double">("scroll");
  
  const [currentChapterIdx, setCurrentChapterIdx] = useState(initialIndex);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [chapterProgress, setChapterProgress] = useState(initialPercentage);
  const [isTransitioningChapter, setIsTransitioningChapter] = useState<"start" | "end" | false>(false);
  
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const chapterRefs = useRef<(HTMLDivElement | null)[]>([]);

  const themeStyles = {
    light: "bg-[#fbfbfb] text-stone-900 selection:bg-stone-200",
    dark: "bg-[#121212] text-stone-200 selection:bg-stone-800",
    sepia: "bg-[#f4ecd8] text-[#433422] selection:bg-[#e3d5ba]"
  };

  const toolbarStyles = {
    light: "bg-white border-stone-200 text-stone-900 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)]",
    dark: "bg-[#1a1a1a] border-stone-800 text-stone-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.3)]",
    sepia: "bg-[#ebdca5] border-[#dfcca0] text-[#433422] shadow-[0_4px_20px_-4px_rgba(67,52,34,0.08)]"
  };

  const widthStyles: Record<number, string> = {
    1: "max-w-2xl",
    2: "max-w-4xl",
    3: "max-w-6xl",
  };

  const inputBg = theme === "dark" ? "bg-stone-800 border-stone-700" : "bg-stone-100 border-stone-300/70";

  const getContainerWidth = () => {
    if (layout === "single") return "max-w-[680px]";
    if (layout === "double") return "max-w-[1424px]"; 
    return widthStyles[widthLevel];
  };

  const handleSaveBookmark = async () => {
    if (bookmarkStatus === "loading") return;
    setBookmarkStatus("loading");

    const currentChapter = chapters[currentChapterIdx];
    if (!currentChapter) return;

    try {
      const sanitizedChapterId = Number(currentChapter.id);
      const sanitizedNovelId = Number(novelId);
      const sanitizedPercentage = Math.round(Number(chapterProgress || 0));

      const response = await fetch("/api/bookmarks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chapterId: sanitizedChapterId,
          novelId: sanitizedNovelId,
          percentage: sanitizedPercentage,
          url: window.location.pathname,
          chapterTitle: currentChapter.title,
        }),
      });

      if (!response.ok) {
        throw new Error(`Server returned status code: ${response.status}`);
      }

      setBookmarkStatus("saved");
    } catch (error) {
      console.error("Failed to save bookmark:", error);
      setBookmarkStatus("idle");
    } finally {
      setTimeout(() => {
        setBookmarkStatus("idle");
      }, 2000);
    }
  };

  useEffect(() => {
    const savedSettings = localStorage.getItem("reader_settings");
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        if (parsed.fontSize) setFontSize(parsed.fontSize);
        if (parsed.theme) setTheme(parsed.theme);
        if (parsed.fontFamily) setFontFamily(parsed.fontFamily);
        if (parsed.widthLevel) setWidthLevel(parsed.widthLevel);
        if (parsed.layout) setLayout(parsed.layout);
      } catch (e) {
        console.error("Failed to parse settings", e);
      }
    }
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;
    const settings = { fontSize, theme, fontFamily, widthLevel, layout };
    localStorage.setItem("reader_settings", JSON.stringify(settings));
  }, [fontSize, theme, fontFamily, widthLevel, layout, isMounted]);

  useEffect(() => {
    if (layout !== "scroll" || !isMounted) return;

    const targetChapter = chapterRefs.current[currentChapterIdx];
    const headerOffset = 80; 
    
    if (targetChapter && !hasInitializedProgress.current) {
      setTimeout(() => {
        const chapterTop = targetChapter.offsetTop;
        let scrollTarget = chapterTop - headerOffset;

        if (initialPercentage > 0) {
           const chapterHeight = targetChapter.offsetHeight;
           const windowHeight = window.innerHeight;
           if (chapterHeight > windowHeight) {
              scrollTarget = chapterTop + ((initialPercentage / 100) * (chapterHeight - windowHeight)) - headerOffset;
           }
        }

        window.scrollTo({ top: Math.max(0, scrollTarget), behavior: "instant" });
        
        setTimeout(() => {
          hasInitializedProgress.current = true;
        }, 50);
        
      }, 150);
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (!hasInitializedProgress.current) return; 

        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const idx = Number(entry.target.getAttribute("data-chapter-index"));
            if (!isNaN(idx)) setCurrentChapterIdx(idx);
          }
        });
      },
      { rootMargin: "-80px 0px -80% 0px" } 
    );

    chapterRefs.current.forEach((ref) => {
      if (ref) observer.observe(ref);
    });

    const handleScrollProgress = () => {
      if (!hasInitializedProgress.current) return; 

      const activeEl = chapterRefs.current[currentChapterIdx];
      if (!activeEl) return;

      const scrollY = window.scrollY;
      const chapterTop = activeEl.offsetTop;
      const chapterHeight = activeEl.offsetHeight;
      const windowHeight = window.innerHeight;

      if (chapterHeight <= windowHeight) {
         setChapterProgress(100);
         return;
      }
      const scrolledInChapter = scrollY - chapterTop + headerOffset;
      const maxScroll = chapterHeight - windowHeight + headerOffset;
      let percentage = Math.round((scrolledInChapter / maxScroll) * 100);
      
      setChapterProgress(Math.max(0, Math.min(100, percentage)));
    };

    window.addEventListener("scroll", handleScrollProgress, { passive: true });

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", handleScrollProgress);
    };
  }, [layout, isMounted, currentChapterIdx, chapters, initialPercentage]);
  
  useEffect(() => {
    if (layout === "scroll") return;
    const el = scrollContainerRef.current;
    if (!el) return;

    const updatePages = () => {
      const gap = 64; 
      const pageWidth = el.clientWidth + gap;
      const pages = Math.max(1, Math.round((el.scrollWidth + gap) / pageWidth));
      setTotalPages(pages);
      if (!hasInitializedProgress.current && initialPercentage > 0) {
        const startPage = Math.max(1, Math.round((initialPercentage / 100) * pages));
        setCurrentPage(startPage);
        el.scrollTo({ left: (startPage - 1) * pageWidth, behavior: "auto" });
        hasInitializedProgress.current = true;
      } 
      else if (isTransitioningChapter === "start") {
        setCurrentPage(1);
        el.scrollTo({ left: 0, behavior: "auto" });
      } else if (isTransitioningChapter === "end") {
        setCurrentPage(pages);
        el.scrollTo({ left: (pages - 1) * pageWidth, behavior: "auto" });
      } else {
        if (currentPage > pages) setCurrentPage(pages);
        el.scrollTo({ left: (Math.min(currentPage, pages) - 1) * pageWidth, behavior: "auto" });
      }
      setIsTransitioningChapter(false);
    };

    const timer = setTimeout(updatePages, 50);
    window.addEventListener("resize", updatePages);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", updatePages);
    };
  }, [chapters, currentChapterIdx, fontSize, fontFamily, layout, widthLevel, isTransitioningChapter, currentPage, initialPercentage]);

  useEffect(() => {
    if (layout === "scroll" || isTransitioningChapter || totalPages === 0) return;
    
    setChapterProgress(Math.round((currentPage / totalPages) * 100));

    const el = scrollContainerRef.current;
    if (!el) return;
    const gap = 64; 
    const pageWidth = el.clientWidth + gap;
    el.scrollTo({ left: (currentPage - 1) * pageWidth, behavior: "smooth" });
  }, [currentPage, layout, isTransitioningChapter, totalPages]);

  useEffect(() => {
    const currentChapterId = chapters[currentChapterIdx]?.id;
    if (!currentChapterId || typeof window === "undefined" || !isMounted || !hasInitializedProgress.current) return;

    const updateUrlTimeout = setTimeout(() => {
      const pathParts = window.location.pathname.split('/');
      if (pathParts[1] === 'novel' && pathParts.length >= 4) {
        pathParts[3] = currentChapterId.toString();
        pathParts[4] = chapterProgress.toString(); 
        
        const newUrl = pathParts.join('/');
        if (window.location.pathname !== newUrl) {
          window.history.replaceState(null, '', newUrl);
        }
      }
    }, 300);

    return () => clearTimeout(updateUrlTimeout);
  }, [currentChapterIdx, chapterProgress, chapters, isMounted]);
  
  const goNext = () => {
    if (currentPage < totalPages) {
      setCurrentPage((p) => p + 1);
    } else if (currentChapterIdx < chapters.length - 1) {
      setIsTransitioningChapter("start");
      setTotalPages(0);
      setCurrentChapterIdx((p) => p + 1);
    }
  };

  const goPrev = () => {
    if (currentPage > 1) {
      setCurrentPage((p) => p - 1);
    } else if (currentChapterIdx > 0) {
      setIsTransitioningChapter("end");
      setTotalPages(0);
      setCurrentChapterIdx((p) => p - 1);
    }
  };

  if (!isMounted) return null;
  const isScroll = layout === "scroll";

  return (
    <div className={`transition-colors duration-500 w-full ${themeStyles[theme]} ${isScroll ? "min-h-screen pb-24" : "h-screen flex flex-col overflow-hidden"}`}>
      <header className={`shrink-0 z-50 w-full border-b transition-colors duration-500 px-6 py-3.5 ${isScroll ? "sticky top-0" : ""} ${toolbarStyles[theme]}`}>
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-6 flex-wrap">
          <div className="flex items-center gap-4 flex-wrap sm:flex-nowrap">
            
            <Link 
              href={`/novel/${novelId}`}
              className={`text-[11px] font-bold uppercase tracking-wider px-3 py-2 rounded-md border flex items-center gap-1.5 transition-all duration-200 active:scale-95 ${inputBg} hover:opacity-80`}
            >
              <span>&larr;</span>
              <span>Table of Contents</span>
            </Link>

            <div className="w-px h-4 bg-current/10 hidden md:block"></div>

            <div className="relative">
              <select 
                value={layout} 
                onChange={(e) => { setLayout(e.target.value as any); setTotalPages(0); }}
                className={`text-xs font-medium tracking-wide px-3 py-2 rounded-md border cursor-pointer focus:outline-none ${inputBg}`}
              >
                <option value="scroll" className="text-black bg-white">Long Scroll</option>
                <option value="single" className="text-black bg-white">Single Page</option>
                <option value="double" className="text-black bg-white">Double Page</option>
              </select>
            </div>

            <div className="relative">
              <select 
                value={fontFamily} 
                onChange={(e) => { setFontFamily(e.target.value); setTotalPages(0); }}
                className={`text-xs font-medium tracking-wide px-3 py-2 rounded-md border cursor-pointer font-sans focus:outline-none ${inputBg}`}
              >
                <option value="font-serif" className="text-black bg-white">Serif (Classic)</option>
                <option value="font-sans" className="text-black bg-white">Sans (Modern)</option>
                <option value="font-mono" className="text-black bg-white">Mono (Draft)</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold tracking-wider opacity-40">A</span>
              <input
                type="range" min="14" max="24" step="2" value={fontSize}
                onChange={(e) => { setFontSize(Number(e.target.value)); setTotalPages(0); }}
                className="w-16 sm:w-20 h-1 rounded-lg cursor-pointer accent-current opacity-70 hover:opacity-100 transition-opacity"
              />
              <span className="text-base font-bold tracking-wider opacity-70">A</span>
            </div>

            <div className="w-px h-4 bg-current/10 hidden sm:block"></div>

            <div className={`flex items-center gap-2 transition-opacity duration-300 ${!isScroll ? 'opacity-30 pointer-events-none' : ''}`}>
              <span className="text-xs font-bold tracking-wider opacity-40">][</span>
              <input
                type="range" min="1" max="3" step="1" value={widthLevel}
                onChange={(e) => setWidthLevel(Number(e.target.value))}
                className="w-16 sm:w-20 h-1 rounded-lg cursor-pointer accent-current opacity-70 hover:opacity-100 transition-opacity"
              />
              <span className="text-xs font-bold tracking-wider opacity-70">[  ]</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-xs font-bold tracking-widest opacity-40 mr-4 hidden sm:block">
               {chapterProgress}%
            </div>
            
            <button 
              onClick={handleSaveBookmark}
              disabled={bookmarkStatus === "loading"}
              className={`text-[10px] font-bold tracking-widest px-3 py-1.5 rounded border transition-all duration-300 flex items-center gap-1.5 select-none mr-2 disabled:opacity-50 ${
                bookmarkStatus === "saved" 
                  ? "bg-green-500/10 text-green-500 border-green-500/30" 
                  : `${inputBg} hover:opacity-80 active:scale-95`
              }`}
            >
              {bookmarkStatus === "saved" ? (
                <><span>&#10003;</span><span>SAVED</span></>
              ) : bookmarkStatus === "loading" ? (
                <span className="animate-pulse">SAVING...</span>
              ) : (
                <span>BOOKMARK</span>
              )}
            </button>

            <button onClick={() => setTheme('light')} className={`w-6 h-6 rounded-full bg-[#fbfbfb] border transition-all duration-200 hover:scale-110 ${theme === 'light' ? 'border-amber-500 ring-4 ring-amber-500/10' : 'border-stone-300'}`} />
            <button onClick={() => setTheme('sepia')} className={`w-6 h-6 rounded-full bg-[#f4ecd8] border transition-all duration-200 hover:scale-110 ${theme === 'sepia' ? 'border-amber-600 ring-4 ring-amber-600/10' : 'border-stone-400/40'}`} />
            <button onClick={() => setTheme('dark')} className={`w-6 h-6 rounded-full bg-[#121212] border transition-all duration-200 hover:scale-110 ${theme === 'dark' ? 'border-amber-400 ring-4 ring-amber-400/10' : 'border-stone-700'}`} />
          </div>
        </div>
      </header>

      <main className={`mx-auto w-full ${getContainerWidth()} ${isScroll ? "px-6 mt-16" : "flex-1 flex flex-col px-6 pt-6 pb-6 min-h-0"}`} style={{ fontSize: `${fontSize}px` }}>
        {isScroll ? (
          chapters.map((chapter, index) => (
            <div 
              key={chapter.id} 
              data-chapter-index={index}
              ref={(el) => { chapterRefs.current[index] = el; }}
            >
              <h1 className={`text-4xl sm:text-5xl font-bold tracking-tight mb-12 leading-tight ${fontFamily}`}>{chapter.title}</h1>
              <article className={`whitespace-pre-wrap leading-relaxed tracking-wide opacity-90 antialiased ${fontFamily}`}>{chapter.content}</article>
              {index < chapters.length - 1 ? <div className="py-40"><hr className="border-current/10" /></div> : <div className="pb-32"></div>}
            </div>
          ))
        ) : (
          <div className="flex-1 flex flex-col min-h-0 w-full relative">
            <div className="shrink-0 mb-6 text-center border-b border-current/10 pb-4">
              <h1 className={`text-xl sm:text-2xl font-bold tracking-tight ${fontFamily}`}>{chapters[currentChapterIdx]?.title}</h1>
              <p className="text-xs uppercase tracking-widest opacity-40 mt-2 font-bold">Chapter {currentChapterIdx + 1} of {chapters.length}</p>
            </div>

            <div className="flex-1 relative group min-h-0">
              <button onClick={goPrev} disabled={currentPage === 1 && currentChapterIdx === 0} className={`absolute -left-12 top-0 bottom-0 w-24 z-10 hover:opacity-100 transition-opacity flex items-center justify-start cursor-pointer disabled:hidden ${totalPages === 0 ? 'opacity-0 pointer-events-none' : 'opacity-0'}`}>
                <span className="text-5xl opacity-40">&lssaquo;</span>
              </button>

              <div 
                ref={scrollContainerRef}
                className={`h-full overflow-hidden transition-opacity duration-200 ${totalPages === 0 ? 'opacity-0' : 'opacity-100'}`}
                style={{ columnCount: layout === 'double' ? 2 : 1, columnGap: '4rem', columnFill: 'auto' }}
              >
                <article className={`whitespace-pre-wrap leading-relaxed tracking-wide opacity-90 antialiased ${fontFamily}`}>{chapters[currentChapterIdx]?.content}</article>
              </div>

              <button onClick={goNext} disabled={currentPage === totalPages && currentChapterIdx === chapters.length - 1} className={`absolute -right-12 top-0 bottom-0 w-24 z-10 hover:opacity-100 transition-opacity flex items-center justify-end cursor-pointer disabled:hidden ${totalPages === 0 ? 'opacity-0 pointer-events-none' : 'opacity-0'}`}>
                <span className="text-5xl opacity-40">&rsaquo;</span>
              </button>
            </div>

            <div className={`shrink-0 flex justify-between items-center mt-6 border-t border-current/10 pt-4 ${totalPages === 0 ? 'invisible' : 'visible'}`}>
              <button onClick={goPrev} disabled={currentPage === 1 && currentChapterIdx === 0} className="text-sm font-bold uppercase tracking-widest opacity-60 hover:opacity-100 disabled:opacity-20 transition-opacity">&larr; Prev</button>
              <span className="text-sm font-medium opacity-50 bg-current/5 px-4 py-1.5 rounded-full">Page {currentPage} of {totalPages} ({chapterProgress}%)</span>
              <button onClick={goNext} disabled={currentPage === totalPages && currentChapterIdx === chapters.length - 1} className="text-sm font-bold uppercase tracking-widest opacity-60 hover:opacity-100 disabled:opacity-20 transition-opacity">Next &rarr;</button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
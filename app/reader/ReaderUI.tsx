"use client";
import { useState } from "react";

export default function ReaderUI({ title, content }: { title: string; content: string }) {
  const [fontSize, setFontSize] = useState(18);
  const [theme, setTheme] = useState<"light" | "dark" | "sepia">("dark");
  const [fontFamily, setFontFamily] = useState("font-serif");
  const [widthLevel, setWidthLevel] = useState(3);

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

  return (
    <div className={`min-h-screen transition-colors duration-500 pb-24 ${themeStyles[theme]}`}>
      
      {/* Elevated Sticky Toolbar (Updated to max-w-6xl) */}
      <header className={`sticky top-0 z-50 w-full border-b transition-colors duration-500 px-6 py-3.5 ${toolbarStyles[theme]}`}>
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-6 flex-wrap">
          
          {/* Left Controls: Typography and Layout */}
          <div className="flex items-center gap-6 flex-wrap sm:flex-nowrap">
            
            {/* Custom Font Dropdown */}
            <div className="relative">
              <select 
                value={fontFamily} 
                onChange={(e) => setFontFamily(e.target.value)}
                className={`text-xs font-medium tracking-wide px-3 py-2 rounded-md border transition-colors duration-300 cursor-pointer font-sans focus:outline-none ${inputBg}`}
              >
                <option value="font-serif" className="text-black bg-white">Serif (Classic)</option>
                <option value="font-sans" className="text-black bg-white">Sans (Modern)</option>
                <option value="font-mono" className="text-black bg-white">Mono (Draft)</option>
              </select>
            </div>

            {/* Font Size Slider */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold tracking-wider opacity-40">A</span>
              <input
                type="range"
                min="14"
                max="22"
                step="2"
                value={fontSize}
                onChange={(e) => setFontSize(Number(e.target.value))}
                className="w-16 sm:w-20 h-1 rounded-lg cursor-pointer accent-current opacity-70 hover:opacity-100 transition-opacity"
              />
              <span className="text-base font-bold tracking-wider opacity-70">A</span>
            </div>

            <div className="w-px h-4 bg-current/10 hidden sm:block"></div>

            {/* Margin / Page Width Slider */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold tracking-wider opacity-40">][</span>
              <input
                type="range"
                min="1"
                max="5"
                step="1"
                value={widthLevel}
                onChange={(e) => setWidthLevel(Number(e.target.value))}
                className="w-16 sm:w-20 h-1 rounded-lg cursor-pointer accent-current opacity-70 hover:opacity-100 transition-opacity"
              />
              <span className="text-xs font-bold tracking-wider opacity-70">[  ]</span>
            </div>
          </div>

          {/* Right Controls: Swatches */}
          <div className="flex items-center gap-3">
            <span className="text-[10px] tracking-widest uppercase opacity-40 font-bold mr-1">Theme</span>
            
            {/* Light Swatch */}
            <button 
              onClick={() => setTheme('light')} 
              aria-label="Switch to light theme"
              className={`w-6 h-6 rounded-full bg-[#fbfbfb] border transition-all duration-200 hover:scale-110 ${theme === 'light' ? 'border-amber-500 ring-4 ring-amber-500/10 scale-105' : 'border-stone-300'}`}
            />
            
            {/* Sepia Swatch */}
            <button 
              onClick={() => setTheme('sepia')} 
              aria-label="Switch to sepia theme"
              className={`w-6 h-6 rounded-full bg-[#f4ecd8] border transition-all duration-200 hover:scale-110 ${theme === 'sepia' ? 'border-amber-600 ring-4 ring-amber-600/10 scale-105' : 'border-stone-400/40'}`}
            />

            {/* Dark Swatch */}
            <button 
              onClick={() => setTheme('dark')} 
              aria-label="Switch to dark theme"
              className={`w-6 h-6 rounded-full bg-[#121212] border transition-all duration-200 hover:scale-110 ${theme === 'dark' ? 'border-amber-400 ring-4 ring-amber-400/10 scale-105' : 'border-stone-700'}`}
            />
          </div>

        </div>
      </header>

      {/* Dynamic Margin/Width Reading Container */}
      <main className={`px-6 mt-16 mx-auto ${widthStyles[widthLevel]}`} style={{ fontSize: `${fontSize}px` }}>
        
        {/* The Chapter Title */}
        <h1 className={`text-3xl sm:text-4xl font-bold tracking-tight mb-10 leading-tight ${fontFamily}`}>
          {title}
        </h1>
        
        {/* The Chapter Content */}
        <article className={`whitespace-pre-wrap leading-relaxed tracking-wide opacity-90 antialiased ${fontFamily}`}>
          {content}
        </article>
        
      </main>
    </div>
  );
} 
// src/app/dashboard/JSONImporter.tsx
'use client';

import { useState } from 'react';
import { importNovelFromJSON, JSONImportNovel } from './actions';

//json importer component (tested on page.tsx)
//temporarily a drop file solution instead of using the extension

interface ImporterProps {
  userId: string;
}

export default function JSONImporter({ userId }: ImporterProps) {
  const [isUploading, setIsUploading] = useState(false);

  //handling and parsing data when uploaded manually
  const handleLocalFileDrop = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const reader = new FileReader();
    
    reader.onload = async (event) => {
      try {
        const parsedData: JSONImportNovel = JSON.parse(event.target?.result as string);
        
        // Pass payload straight down to the secure runtime context action
        await importNovelFromJSON(parsedData, userId);
        alert('Local JSON configuration file imported successfully!');
      } catch (err) {
        alert('Invalid JSON formatting blueprint verified inside document contents.');
      } finally {
        setIsUploading(false);
      }
    };
    
    reader.readAsText(file);
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
      <div>
        <h3 className="text-lg font-bold text-slate-900">Data Synchronization Hub</h3>
        <p className="text-xs text-slate-500">Inject structured programmatic books content streams into Neon.</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">

        {/* NATIVE FILE LOADER */}
        <label className="flex-1 border-2 border-dashed border-slate-200 hover:border-slate-400 cursor-pointer rounded-xl flex items-center justify-center p-2 text-center transition">
          <span className="text-xs font-medium text-slate-600">
            {isUploading ? 'Reading...' : 'Upload Configuration (.json)'}
          </span>
          <input 
            type="file" 
            accept=".json" 
            onChange={handleLocalFileDrop} 
            disabled={isUploading} 
            className="hidden" 
          />
        </label>
      </div>
    </div>
  );
}
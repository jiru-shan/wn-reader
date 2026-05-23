// src/app/dashboard/JSONImporter.tsx
'use client';

import { useState } from 'react';
import { importNovelFromJSON, JSONImportNovel } from './actions';

interface ImporterProps {
  userId: string;
}

export default function JSONImporter({ userId }: ImporterProps) {
  const [isUploading, setIsUploading] = useState(false);

  // Scenario A: Simulating pulling files from a remote API
  const handleFetchFromExternalAPI = async () => {
    setIsUploading(true);
    try {
      // 1. Fetching raw string/stream data from external asset management endpoint
      const response = await fetch('https://api.example.com/external-books/sample-id');
      const externalData: JSONImportNovel = await response.json();

      // 2. Pass straight into our transaction handler server action
      await importNovelFromJSON(externalData, userId);
      alert('External API book synced successfully!');
    } catch (err) {
      console.error(err);
      alert('Failed to sync from external provider.');
    } finally {
      setIsUploading(false);
    }
  };

  // Scenario B: Handling manual file uploads via browser file reader
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
        {/* API TRIGGER BUTTON */}
        <button
          onClick={handleFetchFromExternalAPI}
          disabled={isUploading}
          className="flex-1 bg-black text-white hover:bg-slate-800 disabled:bg-slate-300 transition text-xs font-medium py-3 px-4 rounded-xl"
        >
          {isUploading ? 'Syncing Ecosystem...' : 'Fetch External API Stream'}
        </button>

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
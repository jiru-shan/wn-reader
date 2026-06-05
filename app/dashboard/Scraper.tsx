/// <reference types="chrome" />

'use client';

import { useState } from 'react';
import { fetchScrapingConfig, saveScrapedData } from './actions'; 

type ScrapingConfig = {
  source: string;
  title: string;
  synopsis: string;
  author: string;
  chapterTitle: string;
  chapterContent: string;
};

// Hardcoded or could be moved to an environment variable / prop
const EXTENSION_ID = "mckkfelafefdjncnfoijnhkogpnjekeb";

interface ScrapeFormProps {
  onSuccess?: () => void; // Optional callback for parent state updates
}

export default function ScrapeForm({ onSuccess }: ScrapeFormProps) {
  const [url, setUrl] = useState('');
  const [config, setConfig] = useState<ScrapingConfig | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const handleCheck = async () => {
    setError('');
    setConfig(null);
    setSuccessMessage('');
    setLoading(true);

    try {
      // 1. Call the server action to get the scraping mapping instructions
      const response = await fetchScrapingConfig(url);

      if (!response.success || !response.data) {
        setError('Site not supported');
        setLoading(false);
        return;
      }

      const data = response.data;
      setConfig(data as ScrapingConfig);

      if (!window.chrome?.runtime) {
        setError('Chrome extension runtime not found. Ensure extension is active.');
        setLoading(false);
        return;
      }

      // 2. Send config rules to Chrome extension so it can execute extraction
      window.chrome.runtime.sendMessage(
        EXTENSION_ID,
        {
          type: 'SCRAPE_URL',
          url,
          options: {},
          config: data,
        },
        async (chromeResponse) => {
          if (window.chrome.runtime.lastError) {
            setError('Extension error: ' + window.chrome.runtime.lastError.message);
            setLoading(false);
            return;
          }
          
          if (!chromeResponse?.success) {
            setError('Scrape failed: ' + chromeResponse?.error);
            setLoading(false);
            return;
          }

          // 3. Extension found text content successfully!
          console.log('Scraped text fields from extension:', chromeResponse.data);

          // 4. Pass the real data to database via Server Action
          const saveResult = await saveScrapedData({
            title: chromeResponse.data.title || 'Untitled Novel',
            synopsis: chromeResponse.data.synopsis,
            author: chromeResponse.data.author,
            source: url, 
            chapterList: chromeResponse.data.chapters
          });

          if (!saveResult.success) {
            setError(`Database save failed: ${saveResult.error}`);
          } else {
            setSuccessMessage('🎉 Novel and Chapter successfully saved to your library!');
            setUrl(''); // Clear input on total success
            if (onSuccess) onSuccess(); 
          }
          setLoading(false);
        }
      );

    } catch (err) {
      setError('Invalid URL or network error');
      setLoading(false);
    }
  };

  return (
    <div style={{ width: '100%', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '1rem' }}>
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://example.com/chapter/1"
          disabled={loading}
          style={{ flex: 1, padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
        />
        <button onClick={handleCheck} disabled={loading || !url} style={{ padding: '8px 16px', cursor: 'pointer' }}>
          {loading ? 'Processing...' : 'Scrape & Save'}
        </button>
      </div>

      {error && <p style={{ color: 'red', fontWeight: 'bold', margin: '8px 0' }}>❌ {error}</p>}
      {successMessage && <p style={{ color: 'green', fontWeight: 'bold', margin: '8px 0' }}>{successMessage}</p>}
      
      {config && (
        <div style={{ marginTop: '1rem', padding: '1rem', background: '#f5f5f5', borderRadius: '4px' }}>
          <p style={{ margin: 0, color: '#555', fontSize: '14px' }}>⚙️ Rule match found for source mapping...</p>
        </div>
      )}
    </div>
  );
}
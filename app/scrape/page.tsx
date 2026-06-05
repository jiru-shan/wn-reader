/// <reference types="chrome" />

'use client';
import { useState } from 'react';
import { fetchScrapingConfig, saveScrapedData } from './actions'; // Added save action

type ScrapingConfig = {
  source: string;
  title: string;
  synopsis: string;
  author: string;
  chapterTitle: string;
  chapterContent: string;
};

const EXTENSION_ID = "mckkfelafefdjncnfoijnhkogpnjekeb";

export default function ScrapePage() {
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
        return;
      }

      const data = response.data;
      setConfig(data as ScrapingConfig);

      if (!window.chrome?.runtime) {
        setError('Chrome extension runtime not found. Ensure extension is active.');
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
          // chromeResponse.data should contain the raw values matching the novel/chapter
          console.log('Scraped text fields from extension:', chromeResponse.data);

          // 4. Pass the real data to database via Server Action
          const saveResult = await saveScrapedData({
            title: chromeResponse.data.title || 'Untitled Novel',
            synopsis: chromeResponse.data.synopsis,
            author: chromeResponse.data.author,
            source: url, // save current URL as the reference source
            chapterList: chromeResponse.data.chapters
          });

          if (!saveResult.success) {
            setError(`Database save failed: ${saveResult.error}`);
          } else {
            setSuccessMessage('🎉 Novel and Chapter successfully saved to your library!');
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
    <div style={{ maxWidth: '500px', margin: '2rem auto', fontFamily: 'sans-serif' }}>
      <h1>Import from Website</h1>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '1rem' }}>
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://example.com/chapter/1"
          style={{ flex: 1, padding: '8px' }}
        />
        <button onClick={handleCheck} disabled={loading} style={{ padding: '8px 16px' }}>
          {loading ? 'Processing...' : 'Scrape & Save'}
        </button>
      </div>

      {error && <p style={{ color: 'red', fontWeight: 'bold' }}>❌ {error}</p>}
      {successMessage && <p style={{ color: 'green', fontWeight: 'bold' }}>{successMessage}</p>}
      
      {config && (
        <div style={{ marginTop: '1rem', padding: '1rem', background: '#f5f5f5', borderRadius: '4px' }}>
          <p style={{ margin: 0, color: '#555' }}>⚙️ Rule match found for source mapping...</p>
        </div>
      )}
    </div>
  );
}
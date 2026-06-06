/// <reference types="chrome" />

'use client';

import { useState, useEffect, useRef } from 'react';
import { fetchScrapingConfig, saveScrapedData } from './actions'; 

type ScrapingConfig = {
  source: string;
  title: string;
  synopsis: string;
  author: string;
  chapterTitle: string;
  chapterContent: string;
};

const EXTENSION_ID = "nniojbbdgabgfkjnpcpbpbgbmababcpm";

export default function ScraperWidgetPage() {
  const [url, setUrl] = useState('');
  const [config, setConfig] = useState<ScrapingConfig | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || typeof window === 'undefined') return;
    
    const sendHeight = () => {
      const height = containerRef.current?.getBoundingClientRect().height;
      window.parent.postMessage({ type: 'SCRAPE_RESIZE', height }, '*');
    };

    sendHeight();
    const timer = setTimeout(sendHeight, 50);
    
    return () => clearTimeout(timer);
  }, [error, successMessage, config, loading]);

  const handleCheck = async () => {
    setError('');
    setConfig(null);
    setSuccessMessage('');
    setLoading(true);

    try {
      const response = await fetchScrapingConfig(url);

      if (!response.success || !response.data) {
        setError('Site not supported (yet).');
        setLoading(false);
        return;
      }

      const data = response.data;
      setConfig(data as ScrapingConfig);

      if (!window.chrome?.runtime) {
        setError('Chrome extension runtime not found. Ensure extension is active.');
        setConfig(null); // Clear progress message if extension isn't found
        setLoading(false);
        return;
      }

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
            setConfig(null); // Clear progress on extension errors
            setLoading(false);
            return;
          }
          
          if (!chromeResponse?.success) {
            setError('Scrape failed: ' + chromeResponse?.error);
            setConfig(null); // Clear progress on scraping failures
            setLoading(false);
            return;
          }

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
            setSuccessMessage('Novel and Chapter successfully saved to your library!');
            setUrl(''); 
            
            if (window.parent) {
              window.parent.postMessage({ type: 'SCRAPE_SUCCESS' }, '*');
            }
          }
          
          // CRITICAL FIX: Clear the config state here so the message unmounts
          setConfig(null); 
          setLoading(false);
        }
      );

    } catch (err) {
      setError('Invalid URL or network error');
      setConfig(null); // Clear progress on network errors
      setLoading(false);
    }
  };

  return (
    <div 
      ref={containerRef} 
      style={{ 
        width: '100%', 
        fontFamily: 'sans-serif', 
        background: 'transparent', 
        overflow: 'hidden',
        padding: '4px' 
      }}
    >
      <div style={{ display: 'flex', gap: '8px' }}>
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://example.com/novel/index"
          disabled={loading}
          style={{ flex: 1, padding: '10px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '14px' }}
        />
        <button 
          onClick={handleCheck} 
          disabled={loading || !url} 
          style={{ 
            padding: '10px 20px', 
            cursor: 'pointer', 
            borderRadius: '6px', 
            border: '1px solid #bbb', 
            backgroundColor: '#fff',
            fontWeight: '500',
            fontSize: '14px'
          }}
        >
          {loading ? 'Processing...' : 'Scrape & Save'}
        </button>
      </div>

      {error && <p style={{ color: '#e53e3e', fontWeight: '500', margin: '12px 0 0 0', fontSize: '14px' }}>❌ {error}</p>}
      {successMessage && <p style={{ color: '#38a169', fontWeight: '500', margin: '12px 0 0 0', fontSize: '14px' }}>{successMessage}</p>}
      
      {/* This box now automatically drops out of the DOM when config is reset to null */}
      {config && (
        <div style={{ marginTop: '12px', padding: '12px', background: '#f7fafc', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
          <p style={{ margin: 0, color: '#4a5568', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span></span> Webnovel located, scraping in progress.
          </p>
        </div>
      )}
    </div>
  );
}
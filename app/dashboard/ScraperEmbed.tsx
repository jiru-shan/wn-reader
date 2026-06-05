'use client';

import { useEffect, useState } from 'react';

interface ScrapeFormEmbedProps {
  onSuccess?: () => void;
}

export default function ScrapeFormEmbed({ onSuccess }: ScrapeFormEmbedProps) {
  // Configured with a default safe value that accounts for the input fields and padding
  const [iframeHeight, setIframeHeight] = useState(60);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'SCRAPE_RESIZE' && typeof event.data.height === 'number') {
        setIframeHeight(event.data.height);
      }

      if (event.data?.type === 'SCRAPE_SUCCESS') {
        if (onSuccess) onSuccess();
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onSuccess]);

  return (
    <div style={{ width: '100%', margin: '1rem 0' }}>
      <iframe
        src="/admin/scraper-widget"
        style={{
          width: '100%',
          height: `${iframeHeight}px`,
          border: 'none',
          background: 'transparent',
          overflow: 'hidden',
          transition: 'height 0.12s ease-out'
        }}
        scrolling="no"
        title="Scraper Sandbox"
      />
    </div>
  );
}
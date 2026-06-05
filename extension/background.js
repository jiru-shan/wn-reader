chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "PING") {
    sendResponse({ type: "PONG" });
    return true;
  }

  if (message.type === "SCRAPE_URL") {
    scrapeUrl(message.url, message.options ?? {}, message.config ?? {})
      .then(data => sendResponse({ success: true, data }))
      .catch(err => sendResponse({ success: false, error: err.message }));
    return true;
  }
});

chrome.runtime.onMessageExternal.addListener((message, sender, sendResponse) => {
  if (message.type === "SCRAPE_URL") {
    scrapeUrl(message.url, message.options ?? {}, message.config ?? {})
      .then(data => sendResponse({ success: true, data }))
      .catch(err => sendResponse({ success: false, error: err.message }));
    return true;
  }
});

async function ensureOffscreenDocument() {
  const existing = await chrome.offscreen.hasDocument();
  if (!existing) {
    await chrome.offscreen.createDocument({
      url: "offscreen.html",
      reasons: ["DOM_PARSER"],
      justification: "Parse scraped HTML using DOM APIs",
    });
  }
}

async function parseWithOffscreen(html, config = {}) {
  await ensureOffscreenDocument();
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage({ type: "PARSE_HTML", html, config }, (response) => {
      if (chrome.runtime.lastError) return reject(new Error(chrome.runtime.lastError.message));
      if (!response.success) return reject(new Error(response.error));
      resolve(response.data);
    });
  });
}



async function waitForTabLoad(tabId) {
  return new Promise((resolve) => {
    chrome.tabs.onUpdated.addListener(function listener(updatedTabId, info) {
      if (updatedTabId === tabId && info.status === "complete") {
        chrome.tabs.onUpdated.removeListener(listener);
        resolve();
      }
    });
  });
}

async function waitForElement(tabId, selector, timeout = 5000) {
  const start = Date.now();

  while (Date.now() - start < timeout) {
    const [result] = await chrome.scripting.executeScript({
      target: { tabId },
      func: (sel) => !!document.querySelector(sel),
      args: [selector],
    });

    if (result?.result) return true;
    await new Promise(r => setTimeout(r, 300));
  }

  return false;
}

async function scrapeSingleChapter(url, options = {}, chapterConfig = {}) {
  const { waitForSelector = null, extraDelay = 0 } = options;
  const tab = await chrome.tabs.create({ url, active: false });

  try {
    await waitForTabLoad(tab.id);
    if (waitForSelector) await waitForElement(tab.id, waitForSelector);
    if (extraDelay > 0) await new Promise(r => setTimeout(r, extraDelay));

    const [result] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => document.body.innerHTML,
    });

    const rawHtml = result?.result;
    // Call the new offscreen parser specifically for chapters
    const parsedChapter = await parseChapterWithOffscreen(rawHtml, chapterConfig);
    
    return {
      url,
      ...parsedChapter
    };
  } finally {
    await chrome.tabs.remove(tab.id).catch(() => {});
  }
}

async function parseChapterWithOffscreen(html, config = {}) {
  await ensureOffscreenDocument();
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage({ type: "PARSE_HTML_CHAPTER", html, config }, (response) => {
      if (chrome.runtime.lastError) return reject(new Error(chrome.runtime.lastError.message));
      if (!response.success) return reject(new Error(response.error));
      resolve(response.data);
    });
  });
}

async function scrapeUrl(url, options = {}, config = {}) {
  const { waitForSelector = null, extraDelay = 0 } = options;

  const tab = await chrome.tabs.create({ url, active: false });
  let mainData;

  try {
    await waitForTabLoad(tab.id);

    if (waitForSelector) await waitForElement(tab.id, waitForSelector);
    if (extraDelay > 0) await new Promise(r => setTimeout(r, extraDelay));

    const [result] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => document.body.innerHTML,
    });

    const rawHtml = result?.result;
    mainData = await parseWithOffscreen(rawHtml, config); 

  } finally {
    await chrome.tabs.remove(tab.id).catch(() => {});
  }

  if (!mainData) return null;

  // --- NEW CONCURRENT BATCH PROCESSING MECHANISM ---
  if (Array.isArray(mainData.chapterLinks) && mainData.chapterLinks.length > 0) {
    const scrapedChapters = [];
    const CONCURRENCY_LIMIT = 5; // Load 5 chapters at a time

    // Loop through the links array in steps of 5
    for (let i = 0; i < mainData.chapterLinks.length; i += CONCURRENCY_LIMIT) {
      // Extract a slice of up to 5 links
        const batchUrls = mainData.chapterLinks.slice(i, i + CONCURRENCY_LIMIT);
      
      // Create a promise for each link in the current batch
      // INSIDE YOUR BACKGROUND SCRIPT (scrapeUrl function batching loop):
        const batchPromises = batchUrls.map(async (chapterItem) => {
            try {
                // FIX: Extract the url property string from the object safely
                const targetUrl = typeof chapterItem === 'object' ? chapterItem.url : chapterItem;
                
                if (!targetUrl) return { error: "No URL found for this chapter" };

                const absoluteUrl = new URL(targetUrl, url).href; 
                return await scrapeSingleChapter(absoluteUrl, options, config ?? {});
            } catch (err) {
                console.error(`Failed to scrape chapter:`, chapterItem, err);
                return { error: err.message };
            }
        });

      // Execute all 5 promises in parallel and wait for them all to finish
      const batchResults = await Promise.all(batchPromises);
      
      // Push the results into our master list
      scrapedChapters.push(...batchResults);
    }

    mainData.chapters = scrapedChapters;
  }

  return mainData; 
}
//main function for the extension
//listens to messages from the website and triggers scrapes before sending them to offscreen.js to parse

//debugging function (call from a popup rather than from the website)
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

//website listener
chrome.runtime.onMessageExternal.addListener((message, sender, sendResponse) => {
  if (message.type === "SCRAPE_URL") {
    scrapeUrl(message.url, message.options ?? {}, message.config ?? {})
      .then(data => sendResponse({ success: true, data }))
      .catch(err => sendResponse({ success: false, error: err.message }));
    return true;
  }
});

//make sure offscreen.html exists so offscreen.js exists before parsing is called
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

//send a message to offscreen.js using chrome.runtime.sendMessage (can't communicate directly)
//also a form of information hiding
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


//waits for the tab to load before scraping (some pages have JS loading)
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

//for websites that have really weird loading styles, can wait for an element (ie TOC links) before scraping
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

//helper function for scraping a single chapter so can run multiple through promises
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

//function for parsing chapter (as opposed to parsing the TOC)
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

//what is called when the website sends a link to the extension (triggerd by listener)
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

    //parses data like author and chapter count/synsopsis/etc.
    //also returns a list of links which are then nested through
    const rawHtml = result?.result;
    mainData = await parseWithOffscreen(rawHtml, config); 

  } finally {
    await chrome.tabs.remove(tab.id).catch(() => {});
  }

  if (!mainData) return null;

  if (Array.isArray(mainData.chapterLinks) && mainData.chapterLinks.length > 0) {
    const scrapedChapters = [];
    const CONCURRENCY_LIMIT = 5; 

    for (let i = 0; i < mainData.chapterLinks.length; i += CONCURRENCY_LIMIT) {
        const batchUrls = mainData.chapterLinks.slice(i, i + CONCURRENCY_LIMIT);
      
      //create a promise for each link in the current batch
        const batchPromises = batchUrls.map(async (chapterItem) => {
            try {
                const targetUrl = typeof chapterItem === 'object' ? chapterItem.url : chapterItem;
                
                if (!targetUrl) return { error: "No URL found for this chapter" };

                const absoluteUrl = new URL(targetUrl, url).href; 
                return await scrapeSingleChapter(absoluteUrl, options, config ?? {});
            } catch (err) {
                console.error(`Failed to scrape chapter:`, chapterItem, err);
                return { error: err.message };
            }
        });

        //batch execute 5 at a time (executing dozens as once can get browser flagged + technical limitations)
        const batchResults = await Promise.all(batchPromises);
      
      // push the results into master list
      scrapedChapters.push(...batchResults);
    }

    mainData.chapters = scrapedChapters;
  }

  return mainData; 
}
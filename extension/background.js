chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "PING") {
    sendResponse({ type: "PONG" });
    return true;
  }

  if (message.type === "SCRAPE_URL") {
    scrapeUrl(message.url, message.options ?? {})
      .then(data => sendResponse({ success: true, data }))
      .catch(err => sendResponse({ success: false, error: err.message }));
    return true;
  }
});

chrome.runtime.onMessageExternal.addListener((message, sender, sendResponse) => {
  if (message.type === "SCRAPE_URL") {
    scrapeUrl(message.url, message.options ?? {})
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

async function parseWithOffscreen(html) {
  await ensureOffscreenDocument();
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage({ type: "PARSE_HTML", html }, (response) => {
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

async function scrapeUrl(url, options = {}) {
  const {
    waitForSelector = null,
    extraDelay = 0,
  } = options;

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
    const parsed = await parseWithOffscreen(rawHtml);
    return parsed;

  } finally {
    chrome.tabs.remove(tab.id);
  }
}
//parsing helper script
//being in a separate file frees up background.js temporarily while this is running


//sample parsing config tags from the DB

//source: soafp.com (checks if url is supported)
//title: .entry-title (css class tag)
//synopsis: .entry-synopsis p (grabs all p tags within the bigger entry-synopsis class tag)
//author: NULL (no listed author)
//chapterTitle: .entry-title (same css class but used on a diff page)
//chapterContent: .entry-content p:nth-of-type(n+2) (grabs all but the first p tag within the element with the css tag .entry-content)
//chapterLinks: .entry-content p a (grabs all the a tags within p tags witin .entry-content)

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    function extract(doc, selector) {
        if (!selector) return null;
        
        // Target multiple paragraphs (often websites chunk their chapter text into multiple p tags)
        if (selector.endsWith("p")) {
            const elements = doc.querySelectorAll(selector);
            if (elements.length === 0) return null;
            
            return Array.from(elements)
                .map(el => el.innerText.trim())
                .filter(text => text.length > 0)
                .join("\n\n");
        }
        
        // Target multiple links because TOC is also often chunked into multiple a tags within a list
        if (selector.endsWith("a")) {
            const elements = doc.querySelectorAll(selector);
            if (elements.length === 0) return null;

            return Array.from(elements)
                .filter(el => el.tagName === "A" && el.getAttribute("href"))
                .map(el => ({
                    text: el.innerText.trim(),
                    url: el.getAttribute("href")
                }));
        }
        
        // Fallback for single elements (titles, authors)
        const el = doc.querySelector(selector);
        return el ? el.innerText.trim() : null;
    }

    const { html, config } = message;
    const parser = new DOMParser();

    //extracting proper info from TOC page
    if (message.type === "PARSE_HTML") {
        try {
            const doc = parser.parseFromString(html, "text/html");
            const result = {
                title:        extract(doc, config.title),
                synopsis:     extract(doc, config.synopsis),
                author:       extract(doc, config.author),
                source:       config.source ?? null,
                chapterLinks: extract(doc, config.chapterLink)
            };
            sendResponse({ success: true, data: result });
        } catch (err) {
            sendResponse({ success: false, error: err.message });
        }
        return true;
    }

    //extracting proper info from chapter page
    if (message.type === "PARSE_HTML_CHAPTER") {
        try {
            const doc = parser.parseFromString(html, "text/html");
            const result = {
                title:   extract(doc, config.chapterTitle),
                content: extract(doc, config.chapterContent),
            };
            sendResponse({ success: true, data: result });
        } catch (err) {
            sendResponse({ success: false, error: err.message });
        }
        return true; // Keep channel open
    }
});
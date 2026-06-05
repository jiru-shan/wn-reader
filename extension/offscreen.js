chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    // Keep extraction helper inside the listener scope
    function extract(doc, selector) {
        if (!selector) return null;
        
        // Target multiple paragraphs
        if (selector.endsWith("p")) {
            const elements = doc.querySelectorAll(selector);
            if (elements.length === 0) return null;
            
            return Array.from(elements)
                .map(el => el.innerText.trim())
                .filter(text => text.length > 0)
                .join("\n\n");
        }
        
        // Target links and return structural objects
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
        return true; // Keep channel open
    }

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
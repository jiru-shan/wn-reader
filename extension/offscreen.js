chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "PARSE_HTML") {
    const parser = new DOMParser();
    const doc = parser.parseFromString(message.html, "text/html");

    const result = {
      title: doc.title,
      headings: [...doc.querySelectorAll("h1, h2, h3")].map(el => el.innerText),
      links: [...doc.querySelectorAll("a[href]")].map(el => ({
        text: el.innerText,
        href: el.href,
      })),
    };

    sendResponse({ success: true, data: result });
    return true;
  }
});
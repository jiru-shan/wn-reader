//sample scraper debug code to run the scraper before website was implemented

document.getElementById("scrape").addEventListener("click", async () => {
  const url = document.getElementById("url").value.trim();
  const selector = document.getElementById("selector").value.trim();
  const delay = parseInt(document.getElementById("delay").value) || 0;

  const statusEl = document.getElementById("status");
  const outputEl = document.getElementById("output");

  if (!url) {
    statusEl.textContent = "Please enter a URL.";
    return;
  }

  statusEl.textContent = "Scraping...";
  outputEl.style.display = "none";
  outputEl.textContent = "";

  const options = {};
  if (selector) options.waitForSelector = selector;
  if (delay > 0) options.extraDelay = delay;

  try {
    const response = await chrome.runtime.sendMessage({
        type: "SCRAPE_URL",
        url,
        options,
        config: {} // empty = all fields will be null; fine for raw testing
    });

    if (!response.success) throw new Error(response.error);

    const data = response.data;

    console.log("=== SCRAPE RESULT ===");
    console.log("Title:", data.title);
    console.log("Final URL:", data.url);
    console.log("Text:", data.text);
    console.log("HTML:", data.html);
    console.log("Full object:", data);

    outputEl.style.display = "block";
    outputEl.textContent = [
      `Title:     ${data.title}`,
      `Final URL: ${data.url}`,
      ``,
      `--- TEXT PREVIEW (first 1000 chars) ---`,
      data.text?.slice(0, 1000),
    ].join("\n");

    statusEl.textContent = "Done.";

  } catch (err) {
    statusEl.textContent = "Error: " + err.message;
    console.error("Scrape error:", err);
  }
});
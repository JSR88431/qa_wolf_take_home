// EDIT THIS FILE TO COMPLETE ASSIGNMENT QUESTION 1
const { chromium } = require("playwright");

// VALIDATION IF ARTICLES ARE NEWEST TO OLDEST
async function isSortedDescending(timestamps) {
  return timestamps.every((t, i) => i === 0 || t <= timestamps[i - 1]);
}

// SCRAPING LOGIC TO CHECK ARTICLE TIMESTAMPS
async function sortHackerNewsArticles() {
  // launch browser
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // go to Hacker News
    await page.goto("https://news.ycombinator.com/newest");
    await page.waitForSelector("tr.athing");

    let articles = [];

    while (articles.length < 100) {
      // Collect article title and timestamp safely
      const articlesOnPage = await page.$$eval("tr.athing", rows => {
        return rows.map(row => {
          const title = row.querySelector(".titleline")?.innerText;
          const nextRow = row.nextElementSibling;
          const timeSpan = nextRow?.querySelector("span.age");
          // Timestamp is in title attribute
          const timestampStr = timeSpan?.getAttribute("title");
          return title && timestampStr ? {
            title: title,
            timestamp: new Date(timestampStr)
          } : null;
        }).filter(Boolean);
      });

      articles.push(...articlesOnPage);

      if (articles.length < 100) {
        const moreLink = await page.$("a.morelink");
        if (moreLink) {
          await moreLink.click({ waitUntil: 'load' });
          await page.waitForSelector("tr.athing"); // wait for content again
        } else {
          break;
        }
      }
    }

    const top100 = articles.slice(0, 100);
    const timestamps = top100.map(a => a.timestamp);
    const sorted = await isSortedDescending(timestamps);

    console.log(`Collected ${top100.length} articles.`);
    console.log(`Articles are sorted newest to oldest: ${sorted}`);

  } catch (error) {
    console.error("Error:", error);
  } finally {
    await browser.close();
  }
}

(async () => {
  await sortHackerNewsArticles();
})();

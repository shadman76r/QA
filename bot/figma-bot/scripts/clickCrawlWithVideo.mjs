import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function sameOrigin(baseUrl, href) {
  try {
    const base = new URL(baseUrl);
    const u = new URL(href, baseUrl);
    return u.origin === base.origin;
  } catch {
    return false;
  }
}

async function scrollPage(page) {
  await page.evaluate(async () => {
    await new Promise(resolve => {
      let totalHeight = 0;
      const distance = 400;
      const timer = setInterval(() => {
        const { scrollHeight } = document.body;
        window.scrollBy(0, distance);
        totalHeight += distance;
        if (totalHeight >= scrollHeight) {
          clearInterval(timer);
          resolve();
        }
      }, 500);
    });
  });
}

async function main() {
  const startUrl = process.argv[2];
  if (!startUrl) {
    console.error('Usage: node clickCrawlWithVideo.mjs <START_URL>');
    process.exit(1);
  }

  const videosDir = path.join(__dirname, '..', 'artifacts', 'videos');
  if (!fs.existsSync(videosDir)) {
    fs.mkdirSync(videosDir, { recursive: true });
  }

  const browser = await chromium.launch({ headless: true });

  // One context with video ON for the whole journey
  const context = await browser.newContext({
    recordVideo: {
      dir: videosDir,
      size: { width: 1440, height: 900 }
    },
    viewport: { width: 1440, height: 900 }
  });

  const page = await context.newPage();
  const visited = new Set();

  async function explore(url, depth = 0, maxDepth = 2) {
    if (visited.has(url) || depth > maxDepth) return;
    visited.add(url);

    console.log('Visiting:', url);
    await page.goto(url, { waitUntil: 'networkidle' });

    // Scroll to show the page contents in the video
    await scrollPage(page);

    // Get all links on this page (with selectors)
    const links = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('a'))
        .map((a, index) => ({
          href: a.href,
          text: a.innerText.trim(),
          index
        }))
        .filter(l => l.href);
    });

    for (const link of links) {
      if (!sameOrigin(url, link.href)) continue;
      if (visited.has(link.href)) continue;

      console.log('  Clicking link:', link.text || link.href);

      // Click the link by index to make sure we hit the right element
      await page.evaluate((idx) => {
        const a = document.querySelectorAll('a')[idx];
        if (a) a.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, link.index);

      await page.waitForTimeout(500);

      // Actually click
      await page.click(`a:nth-of-type(${link.index + 1})`, { timeout: 5000 }).catch(() => {});

      try {
        await page.waitForLoadState('networkidle', { timeout: 10000 });
      } catch {
        // ignore timeouts
      }

      // Scroll new page
      await scrollPage(page);

      // Recursive explore of the new page
      await explore(page.url(), depth + 1, maxDepth);

      // Go back to previous page to click next link
      await page.goBack({ waitUntil: 'networkidle' }).catch(() => {});
    }
  }

  await explore(startUrl, 0, 2);

  await context.close(); // saves the video
  await browser.close();

  console.log('Done. Visited pages:', visited.size);
  console.log('Video files are in:', videosDir);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});

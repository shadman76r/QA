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

function safeFileName(url) {
  return url
    .replace(/^https?:\/\//, '')
    .replace(/[^\w.-]+/g, '_')
    .slice(0, 200);
}

async function main() {
  const startUrl = process.argv[2];
  if (!startUrl) {
    console.error('Usage: node scripts/crawlSiteWithVideos.mjs <START_URL>');
    process.exit(1);
  }

  const videosDir = path.join(__dirname, '..', 'artifacts', 'videos');
  if (!fs.existsSync(videosDir)) {
    fs.mkdirSync(videosDir, { recursive: true });
  }

  const browser = await chromium.launch({ headless: true });

  const visited = new Set();
  const queue = [startUrl];

  while (queue.length) {
    const url = queue.shift();
    if (visited.has(url)) continue;
    visited.add(url);

    console.log('Visiting:', url);

    // Create a new context for each page so we get a separate video file
    const context = await browser.newContext({
      recordVideo: {
        dir: videosDir,
        size: { width: 1440, height: 900 }
      },
      viewport: { width: 1440, height: 900 }
    });

    const page = await context.newPage();
    await page.goto(url, { waitUntil: 'networkidle' });

    // Scroll the page to record a meaningful video
    await scrollPage(page);

    // Collect all links on this page
    const links = await page.evaluate(() =>
      Array.from(document.querySelectorAll('a'))
        .map(a => a.href)
        .filter(Boolean)
    );

    for (const href of links) {
      if (sameOrigin(startUrl, href) && !visited.has(href)) {
        queue.push(href);
      }
    }

    // Close context to finalize video file
    await context.close();

    // After context close, videos are written to disk
    const files = fs.readdirSync(videosDir);
    // Optionally, you could rename the last video file to include URL info.
    // For simplicity we just log.
    console.log('Recorded video for:', url);
  }

  await browser.close();
  console.log('Done. Visited pages:', visited.size);
  console.log('Videos saved in:', videosDir);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
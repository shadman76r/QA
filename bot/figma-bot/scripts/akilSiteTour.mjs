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

async function collectAllInternalUrls(startUrl, maxPages = 30) {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  const visited = new Set();
  const queue = [startUrl];

  while (queue.length && visited.size < maxPages) {
    const url = queue.shift();
    if (visited.has(url)) continue;
    visited.add(url);

    console.log('Crawl visiting:', url);
    try {
      await page.goto(url, { waitUntil: 'networkidle', timeout: 20000 });
    } catch {
      console.log('  Failed to load:', url);
      continue;
    }

    const links = await page.evaluate(() =>
      Array.from(document.querySelectorAll('a'))
        .map(a => a.href)
        .filter(Boolean)
    );

    for (const href of links) {
      if (sameOrigin(startUrl, href) && !visited.has(href) && !queue.includes(href)) {
        queue.push(href);
      }
    }
  }

  await browser.close();
  return Array.from(visited);
}

async function recordTour(urls, videoPathDir) {
  const browser = await chromium.launch({ headless: true });

  const context = await browser.newContext({
    recordVideo: {
      dir: videoPathDir,
      size: { width: 1440, height: 900 }
    },
    viewport: { width: 1440, height: 900 }
  });

  const page = await context.newPage();

  for (const url of urls) {
    console.log('Tour visiting:', url);
    try {
      await page.goto(url, { waitUntil: 'networkidle', timeout: 20000 });
      await scrollPage(page);
      await page.waitForTimeout(1000); // small pause
    } catch {
      console.log('  Failed during tour:', url);
    }
  }

  await context.close();
  await browser.close();
}

async function main() {
  const startUrl = 'https://www.akilautomobiles.com';

  const artifactsDir = path.join(__dirname, '..', 'artifacts');
  const videosDir = path.join(artifactsDir, 'videos');
  if (!fs.existsSync(videosDir)) {
    fs.mkdirSync(videosDir, { recursive: true });
  }

  console.log('Step 1: Crawling to collect internal URLs...');
  const urls = await collectAllInternalUrls(startUrl, 50); // limit to 50 pages max
  console.log('Collected URLs:', urls.length);
  console.log(urls.join('\n'));

  console.log('\nStep 2: Recording site tour video...');
  await recordTour(urls, videosDir);

  console.log('\nDone. Video saved in:', videosDir);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});

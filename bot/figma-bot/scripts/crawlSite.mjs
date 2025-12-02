import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import path from 'path';

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
    console.error('Usage: node scripts/crawlSite.mjs <START_URL>');
    process.exit(1);
  }

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  const visited = new Set();
  const queue = [startUrl];

  while (queue.length) {
    const url = queue.shift();
    if (visited.has(url)) continue;
    visited.add(url);

    console.log('Visiting:', url);
    await page.goto(url, { waitUntil: 'networkidle' });

    // scroll down to simulate a human and load lazy content
    await scrollPage(page);

    // collect all links
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
  }

  await browser.close();
  console.log('Done. Visited pages:', visited.size);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});

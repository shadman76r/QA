import fs from 'fs';
import path from 'path';
import { chromium } from 'playwright';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  const pageUrl = process.argv[2];
  if (!pageUrl) {
    console.error('Usage: node scripts/extractDomSpecs.mjs <PAGE_URL>');
    process.exit(1);
  }

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  await page.goto(pageUrl, { waitUntil: 'networkidle' });

  const specs = await page.evaluate(() => {
    const elements = [];

    document.querySelectorAll('nav, header, footer, button, a, h1, h2, h3, h4, h5, h6, p, span, div').forEach(el => {
      const rect = el.getBoundingClientRect();
      const style = window.getComputedStyle(el);
      const text = el.innerText.trim();
      if (!text) return;

      elements.push({
        text,
        tag: el.tagName.toLowerCase(),
        x: rect.x,
        y: rect.y,
        width: rect.width,
        height: rect.height,
        fontSize: parseFloat(style.fontSize),
        fontFamily: style.fontFamily,
        color: style.color,
        backgroundColor: style.backgroundColor
      });
    });

    return elements;
  });

  await browser.close();

  const outPath = path.join(__dirname, '..', 'artifacts', 'dom-specs.json');
  fs.writeFileSync(outPath, JSON.stringify(specs, null, 2), 'utf8');
  console.log('Saved DOM specs to', outPath);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});

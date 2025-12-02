const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  const pageUrl = process.argv[2];
  if (!pageUrl) {
    console.error('Usage: node scripts/capturePage.js <PAGE_URL>');
    process.exit(1);
  }

  const artifactsDir = path.join(__dirname, '..', 'artifacts');
  if (!fs.existsSync(artifactsDir)) {
    fs.mkdirSync(artifactsDir);
  }

  const browser = await chromium.launch();
  const page = await browser.newPage();

  await page.goto(pageUrl, { waitUntil: 'networkidle' });

  await page.screenshot({
    path: path.join(artifactsDir, 'live-page.png'),
    fullPage: true
  });

  const html = await page.content();
  fs.writeFileSync(path.join(artifactsDir, 'live-page.html'), html, 'utf8');

  await browser.close();
  console.log('Captured screenshot and HTML for:', pageUrl);
})();

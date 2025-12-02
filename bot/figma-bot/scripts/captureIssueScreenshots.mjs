import fs from 'fs';
import path from 'path';
import { chromium } from 'playwright';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function loadJson(relPath) {
  const full = path.join(__dirname, '..', 'artifacts', relPath);
  return JSON.parse(fs.readFileSync(full, 'utf8'));
}

async function main() {
  const pageUrl = process.argv[2];
  if (!pageUrl) {
    console.error('Usage: node scripts/captureIssueScreenshots.mjs <PAGE_URL>');
    process.exit(1);
  }

  const compareReport = loadJson('compare-report.json');
  const diffs = compareReport.filter(i => i.status === 'DIFFERENT');

  if (!diffs.length) {
    console.log('No DIFFERENT items in compare-report.json, nothing to capture.');
    return;
  }

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(pageUrl, { waitUntil: 'networkidle' });

  const screenshotsDir = path.join(__dirname, '..', 'artifacts', 'issue-shots');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  for (const item of diffs) {
    const text = (item.text || '').trim();
    if (!text) continue;

    // Find element by text content in the browser
    const handle = await page.$(`xpath=//*[normalize-space(text()) = "${text}"]`);
    if (!handle) {
      console.log(`No element found on page for text: "${text}"`);
      continue;
    }

    const safeId = item.figmaId.replace(/[:/]/g, '-');
    const fileName = `issue-${safeId}.png`;
    const shotPath = path.join(screenshotsDir, fileName);

    await handle.screenshot({ path: shotPath });
    console.log(`Captured screenshot for "${text}" -> ${fileName}`);

    // attach path back into report item (we’ll use this in QA report)
    item.screenshotPath = `artifacts/issue-shots/${fileName}`;
  }

  // Save updated compare-report with screenshotPath info
  const updatedPath = path.join(__dirname, '..', 'artifacts', 'compare-report-with-shots.json');
  fs.writeFileSync(updatedPath, JSON.stringify(compareReport, null, 2), 'utf8');
  console.log('Updated compare report with screenshot paths at', updatedPath);

  await browser.close();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});

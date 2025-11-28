// ----------------------------
// AFOCUS.CA – PLAYWRIGHT SCRIPT
// Takes real screenshots for all navigation pages
// ----------------------------

const { chromium } = require('@playwright/test');
const path = require('path');
const fs = require('fs');

// Base website
const BASE_URL = 'https://www.afocus.ca/';

// Output folder
const OUTPUT_DIR = path.join(__dirname, 'afocus_screenshots');

// Create folder if it doesn’t exist
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR);
}

// Header navigation links (text, filename)
const HEADER_LINKS = [
  ['Inventory', '01_header_inventaire'],
  ['Finance', '02_header_financement'],
  ['Services', '03_header_services'],
  ['Contact Us', '04_header_nous_joindre'], 
];

// Footer navigation links
const FOOTER_LINKS = [
  ['Vendez-nous votre véhicule', '05_footer_vendez_nous'],
  ["Offres d'emploi", '06_footer_offres_emploi'],
  ['Politique de confidentialité', '07_footer_confidentialite'],
  ['Termes et conditions', '08_footer_termes_conditions'],
];

// Save screenshot
async function takeScreenshot(page, label) {
  const filePath = path.join(OUTPUT_DIR, `${label}.png`);
  await page.screenshot({ path: filePath, fullPage: true });
  console.log(`[OK] Screenshot saved → ${filePath}`);
}

// MAIN FUNCTION
(async () => {
  // Launch Chrome (Visible UI)
  const browser = await chromium.launch({
    headless: false, // change to true for invisible mode
  });

  const page = await browser.newPage({
    viewport: { width: 1920, height: 1080 },
  });

  try {
    // ----------------------------
    // 0. HOMEPAGE
    // ----------------------------
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    await takeScreenshot(page, '00_homepage');

    // ----------------------------
    // 1. HEADER LINKS
    // ----------------------------
    for (const [text, label] of HEADER_LINKS) {
      await page.goto(BASE_URL, { waitUntil: 'networkidle' });
      await page.waitForTimeout(1500);

      console.log(`Clicking header → ${text}`);

      const link = page.getByRole('link', { name: text, exact: false });
      await link.click();

      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      await takeScreenshot(page, label);
    }

    // ----------------------------
    // 2. FOOTER LINKS
    // ----------------------------
    for (const [text, label] of FOOTER_LINKS) {
      await page.goto(BASE_URL, { waitUntil: 'networkidle' });
      await page.waitForTimeout(1500);

      // Scroll to footer
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(2000);

      console.log(`Clicking footer → ${text}`);

      const link = page.getByRole('link', { name: text, exact: false });
      await link.click();

      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      await takeScreenshot(page, label);
    }

    // ----------------------------
    // 3. VEHICLE DETAILS PAGE
    // ----------------------------
    try {
      await page.goto(BASE_URL, { waitUntil: 'networkidle' });
      await page.waitForTimeout(2000);

      await page.getByRole('link', { name: 'Inventaire', exact: false }).click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      // Click first vehicle in the inventory
      const firstCar = page.locator("a[href*='/cars/']").first();
      await firstCar.click();

      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      await takeScreenshot(page, '09_vehicle_details');
    } catch (err) {
      console.log('[WARN] Vehicle details page not found:', err.message);
    }

  } catch (error) {
    console.log('[ERROR] Test failed:', error);
  } finally {
    await browser.close();
    console.log('✔ Done! All screenshots saved in /afocus_screenshots');
  }
})();

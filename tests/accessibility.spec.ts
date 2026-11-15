// Accessibility checks. Loops over test-data/home.json (the same data as
// home.spec.ts) so every page added there gets an axe scan for free.
import { test } from '../fixture/test-options';
import homeData from '../test-data/home.json';
import { generateAccessibilityReport } from '../utility/accessibility';
import { HomePageData } from '../pages/klipboard-homepage';

function slugify(url: string): string {
  return url.replace(/^https?:\/\//, '').replace(/[^a-z0-9]+/gi, '-').toLowerCase();
}

for (const row of homeData as HomePageData[]) {
  test(`accessibility scan: ${row.url}`, async ({ page }) => {
    test.slow(); // axe scans routinely take longer than the default test timeout
    await page.goto(row.url);
    await generateAccessibilityReport(page, `${slugify(row.url)}-accessibility-report.html`);
  });
}

// Data-driven tests for the KlipBoard home page. Loops over every row in
// test-data/home.json, so adding a new row adds a new set of checks with no code changes.
import { test, expect } from '../fixture/test-options';
import homeData from '../test-data/home.json';
import { KlipboardHomepage, HomePageData } from '../pages/klipboard-homepage';

for (const row of homeData as HomePageData[]) {
  test.describe(`${row.url} home page content`, () => {
    let homepage: KlipboardHomepage;

    test.beforeEach(async ({ page }) => {
      homepage = new KlipboardHomepage(page, row);
      await homepage.gotoHomepage();
    });

    test('verify the page loads', async ({ page }) => {
      await expect(page).toHaveURL(row.url);
    });

    if (row.title) {
      test('verify the page title is as expected', async ({ page }) => {
        await expect(page).toHaveTitle(new RegExp(row.title as string));
      });
    }

    if (row.heading) {
      test('verify the main heading is visible', async () => {
        await expect(homepage.heading!).toBeVisible();
      });
    }
  });
}

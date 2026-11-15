// Custom test fixtures. Specs import `test`/`expect` from here (not from
// @playwright/test directly) so they get ready-made page objects for free.
import { test as base } from '@playwright/test';
import { BasePage } from '../pages/base-page';
import { KlipboardHomepage } from '../pages/klipboard-homepage';
import homeData from '../test-data/home.json';

type MyFixtures = {
  basePage: BasePage;
  homepage: KlipboardHomepage;
};

export const test = base.extend<MyFixtures>({
  basePage: async ({ page }, use) => {
    await use(new BasePage(page));
  },
  homepage: async ({ page }, use) => {
    await use(new KlipboardHomepage(page, homeData[0]));
  },
});

export { expect } from '@playwright/test';

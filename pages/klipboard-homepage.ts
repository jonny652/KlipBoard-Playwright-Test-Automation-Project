// Page object for the KlipBoard homepage. Built from a HomePageData row
// (see test-data/home.json) so the same class can check any home page URL.
import { Page, Locator } from '@playwright/test';
import { BasePage } from './base-page';

export interface HomePageData {
  url: string;
  title?: string;
  heading?: string;
}

export class KlipboardHomepage extends BasePage {
  readonly url: string;
  readonly heading?: Locator;

  constructor(page: Page, data: HomePageData) {
    super(page);
    this.url = data.url;

    if (data.heading) {
      this.heading = page.getByRole('heading', { name: data.heading });
    }
  }

  async gotoHomepage() {
    await this.page.goto(this.url);
  }
}

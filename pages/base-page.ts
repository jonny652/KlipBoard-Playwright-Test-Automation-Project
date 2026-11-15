// Shared base class for all page objects. Every page extends this so
// common helpers (e.g. cookie banners) only need to be written once.
import { Page } from '@playwright/test';

export class BasePage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }
}

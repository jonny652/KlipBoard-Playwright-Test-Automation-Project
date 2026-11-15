// API-level checks against KlipBoard's own public endpoints, hit directly via
// HTTP (no browser page involved). Loops over test-data/api-endpoints.json.
import { test, expect } from '../fixture/test-options';
import apiEndpoints from '../test-data/api-endpoints.json';
import homeData from '../test-data/home.json';
import { HomePageData } from '../pages/klipboard-homepage';

interface ApiEndpointData {
  path: string;
  expectedStatus: number;
  contentType?: string;
  bodyContains?: string;
}

for (const row of apiEndpoints as ApiEndpointData[]) {
  test(`GET ${row.path} responds as expected`, async ({ request }) => {
    const response = await request.get(row.path);
    expect(response.status()).toBe(row.expectedStatus);

    // Only runs when the data row includes a `contentType`.
    if (row.contentType) {
      expect(response.headers()['content-type']).toContain(row.contentType);
    }

    // Only runs when the data row includes a `bodyContains`.
    if (row.bodyContains) {
      expect(await response.text()).toContain(row.bodyContains);
    }
  });
}

// Resilience checks: KlipBoard has no first-party API to mock (see CLAUDE.md),
// so these use page.route() to intercept the home page's own document request
// and simulate conditions we can't trigger on the real, live site.
const homeRow = (homeData as HomePageData[])[0];

test('home page still loads when the response is slow', async ({ page, homepage }) => {
  test.slow(); // the artificial delay below pushes this past the default timeout
  await page.route(homeRow.url, async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 3000));
    await route.continue();
  });
  await homepage.gotoHomepage();
  await expect(homepage.heading!).toBeVisible({ timeout: 10000 });
});

test('navigation fails cleanly when the connection drops', async ({ page, homepage }) => {
  await page.route(homeRow.url, (route) => route.abort('connectionfailed'));
  await expect(homepage.gotoHomepage()).rejects.toThrow();
});

test('a 500 response from the server is surfaced, not silently ignored', async ({ page, homepage }) => {
  await page.route(homeRow.url, (route) => route.fulfill({ status: 500 }));
  const response = await homepage.gotoHomepage();
  expect(response?.status()).toBe(500);
});

test('unexpected page content is detected rather than silently passing', async ({ page, homepage }) => {
  await page.route(homeRow.url, (route) => route.fulfill({
    status: 200,
    contentType: 'text/html',
    body: '<html><body><h1>Unexpected Page</h1></body></html>',
  }));
  await homepage.gotoHomepage();
  await expect(homepage.heading!).not.toBeVisible();
});

// Not simulated — a real request against the live site, since nothing else checks performance.
test('home page responds within a reasonable time budget', async ({ request }) => {
  const start = Date.now();
  const response = await request.get(homeRow.url);
  const elapsedMs = Date.now() - start;

  expect(response.status()).toBe(200);
  expect(elapsedMs).toBeLessThan(5000);
});

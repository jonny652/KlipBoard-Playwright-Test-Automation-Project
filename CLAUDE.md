# Project Notes

Playwright + TypeScript test suite for the KlipBoard website (https://www.klipboard.com). Tests run against the live site — there is no local dev server to start.

## Setup

- `npm test` — run full suite (chromium, firefox)
- `npm run test:headed` / `test:debug` / `test:ui`
- `npm run report` — open last HTML report
- `npm run codegen` — launch Playwright codegen against klipboard.com
- `npm run allure:generate` / `npm run allure:open` — build and view the Allure report

## Progress Log

### 2026-11-15 — Added API resilience & performance tests
Extended `tests/api.spec.ts` to cover what happens when the real site misbehaves, not just the happy path: a slow response, a dropped connection, a hard 500, and the page returning unexpected content — plus one unmocked performance-budget check (`request.get('/')` timed, asserted under 5s). Same `page.route()` interception technique as Trade Source's `certificates-api.spec.ts`, just applied to the home page's own document request instead of a first-party API, since KlipBoard doesn't have one (see the entry below).
- Found `test-data/home.json` had no `heading` field, so `home.spec.ts`'s "verify the main heading is visible" test was silently never registered (`if (row.heading)` was always false) — nobody would have noticed without checking the test list directly. **Fix:** added the real H1 text (`"AI-Powered Business Management Software Built for Your Industry"`, confirmed from the live page) to `home.json`.
- **Takeaway:** an optional field in a data-driven test file can silently skip real coverage if it's just never populated — worth periodically checking `npx playwright test --list` against test-data files to confirm every intended assertion is actually registered, not just passing.
- **Verified the new failure-mode tests aren't vacuous:** temporarily removed the `page.route()` call from the "connection dropped" and "500 response" tests and confirmed they then fail for the right reason (promise resolves instead of rejecting; status is 200 instead of 500), before restoring. Worth doing this for any test whose assertion could be trivially satisfied by the unmocked real page.

### 2026-11-15 — Added API-level tests
Looked at how Trade Source does "API tests" (`tests/certificates-api.spec.ts`): browser-level `page.route()` interception scoped to their own first-party `**/api/graphql` endpoint, used to simulate edited/empty/error/slow responses and check the UI reacts correctly. That technique needs a first-party API to intercept — KlipBoard (a Webflow marketing site) doesn't expose one in its page source.
- Checked the homepage's `content-security-policy` response header to see what it actually calls: all third-party SaaS (HubSpot, Google Analytics, etc.) plus one custom geo-location Cloudflare Worker. Probed that worker directly — it returned `403 {"error":"Origin not allowed"}`, confirming it's deliberately restricted to requests from the real site. Left it alone rather than working around the restriction.
- **Instead:** added `tests/api.spec.ts`, data-driven over a new `test-data/api-endpoints.json`, using Playwright's `request` fixture (`APIRequestContext`) to hit genuinely public endpoints directly over HTTP — homepage, `robots.txt`, `sitemap.xml` — asserting status code, content-type, and a body substring. No fragile full-header/CSP matching (those change often on a site with this many trackers).
- **Takeaway:** a site's `content-security-policy` header (`connect-src` in particular) is a quick way to see what backend/API endpoints a page actually calls, before assuming "there's no API to test" or trying to find one by scanning HTML/JS.

### 2026-11-15 — Added accessibility scanning (axe-core) + Allure reporting
Added `tests/accessibility.spec.ts`, data-driven over `test-data/home.json` (unlike Trade Source's single hardcoded test — every row in that JSON now gets an axe scan for free). Scan logic lives in `utility/accessibility.ts` (`generateAccessibilityReport`), same "report only, never fail" behaviour as Trade Source: publishes an HTML report to `accessibility-reports/`, doesn't assert zero violations.
- Axe scans routinely ran past the default 30s test timeout under full-suite parallel load (an isolated run took ~14s, fine; the full 6-test parallel run occasionally didn't). **Fix:** `test.slow()` in the accessibility test (triples the timeout) rather than raising the global timeout for every test.
- **Allure:** added `allure-playwright` + `allure-commandline` as devDependencies, wired into `playwright.config.ts`'s `reporter` array alongside the existing `html` reporter. **Pinned `allure-playwright` to `^2.15.1`** (not the current `3.x` line) — `allure-playwright@3` depends on a different results schema (`allure-js-commons@3`) that isn't meant to pair with the classic Java-based Allure2 CLI (`allure-commandline`). The well-established, documented combo is v2 of both. Java (OpenJDK 21) was already present on this machine, so `allure-commandline` worked without any extra setup.
- **Takeaway:** check major-version alignment between a reporter package and the CLI/tool that consumes its output before installing — "latest" isn't always the one that's compatible with the rest of the toolchain.



### 2026-11-15 — Initial data-driven scaffold
Created the folder structure mirroring the Trade Source project's data-driven approach, scoped to the home page only for this first pass: `pages/base-page.ts` + `pages/klipboard-homepage.ts`, `test-data/home.json` + README, `fixture/test-options.ts`, `tests/home.spec.ts` (loops over JSON rows, registering optional assertions conditionally).
- Added `tsconfig.json` (`resolveJsonModule: true`, required to `import` the JSON test-data files) and `typescript` as a devDependency so `tsc --noEmit` works for type-checking.
- Set `baseURL` in `playwright.config.ts` to `https://www.klipboard.com`.
- BDD, accessibility reporting, visual regression, auth setup, and API interception (all present in the Trade Source project) were deliberately left out of this first pass — see "Ideas to explore next" below.

### 2026-11-15 — WebKit blocked by Windows Smart App Control
`npx playwright test --project=webkit` reported "Host system is missing dependencies" for `libwebp.dll` and `sqlite3.dll`, even though both files exist in the installed WebKit folder. Traced with Playwright's own `PrintDeps.exe` dependency walker run directly against those two DLLs (not just the main `.exe`), which returned the real cause: `"An Application Control policy has blocked this file."` Confirmed Windows Smart App Control is enforcing (`VerifiedAndReputablePolicyState = 1`) — it blocks these two unsigned bundled DLLs from loading.
- **Fix:** commented out the `webkit` project in `playwright.config.ts` rather than disabling Smart App Control (a one-way setting — Microsoft only lets it be re-enabled via a clean Windows reinstall). Suite runs chromium + firefox for now.
- **Takeaway:** on Windows, Playwright's "missing dependencies" error can mean "blocked by security policy", not "not installed" — worth checking `PrintDeps.exe <file>` on the specific flagged DLL directly if this comes up again.

## Known Issues

- WebKit disabled on this dev machine due to Smart App Control (see above). Re-enable the project block in `playwright.config.ts` if that setting ever changes.

## Conventions

Carried over from the Trade Source project:
- Prefer role-based / `data-testid` locators over structural locators (e.g. `.locator('p')` off a heading) — more resilient to markup changes. (`klipboard-homepage.ts` uses `getByRole('heading', ...)`.)
- Each test should navigate independently (full `goto` per test/`beforeEach`), not rely on a previous test leaving the page in a particular state — keeps tests safe to run individually or in any order.
- Data-driven specs: an optional field in the test-data JSON should only register its `test()`/assertion when present (`if (row.field) { test(...) }`), so partial data never breaks the suite.
- Custom fixtures file (`fixture/test-options.ts`) is the single import point for `test`/`expect` in specs — keeps page-object wiring in one place, and is the one line that would need to change if BDD (`playwright-bdd`) is ever added later.
- Mark inherently slow tests (e.g. anything doing an axe scan) with `test.slow()` rather than raising the global timeout for the whole suite.

## Ideas to explore next

Already proven out in the Trade Source project — worth revisiting as this project grows beyond the home page:
- **Visual regression** via `expect(page).toHaveScreenshot()` with OS/browser-keyed baselines.
- **BDD/Gherkin** via `playwright-bdd`, if non-technical stakeholders need to read/write scenarios.
- **Auth setup project** (`auth.setup.ts` + saved `storageState`) once there's a login flow to test.

API testing is now covered (`tests/api.spec.ts`) via real public-endpoint checks rather than Trade Source's `page.route()` first-party-API mocking — see the 2026-11-15 entry above for why. Revisit `page.route()`-style interception if KlipBoard ever exposes its own first-party API to mock.

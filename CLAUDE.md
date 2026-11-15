# Project Notes

Playwright + TypeScript test suite for the KlipBoard website (https://www.klipboard.com). Tests run against the live site — there is no local dev server to start.

## Setup

- `npm test` — run full suite (chromium, firefox)
- `npm run test:headed` / `test:debug` / `test:ui`
- `npm run report` — open last HTML report
- `npm run codegen` — launch Playwright codegen against klipboard.com
- `npm run allure:generate` / `npm run allure:open` — build and view the Allure report

## Progress Log

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
- **API/network interception** (`page.route()`) for edge cases that are hard to trigger through the UI.

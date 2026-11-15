```
   /\  /\
  /  \/  \
  \  /\  /
   \/  \/

#   # #      ###  ####  ####   ###   ###  ####  ####
#  #  #       #   #   # #   # #   # #   # #   # #   #
###   #       #   ####  ####  #   # ##### ####  #   #
#  #  #       #   #     #   # #   # #   # #  #  #   #
#   # #####  ###  #     ####   ###  #   # #   # ####
```

# KlipBoard Playwright Test Automation Project

End-to-end tests for the [KlipBoard](https://www.klipboard.com) website, built with [Playwright](https://playwright.dev) and TypeScript.

## About this project

This framework applies learnings from previous Playwright projects, built around a **data-driven test structure**: test data lives in plain JSON files, page objects are built from that data, and specs loop over the data to generate their checks. Adding a new row of data adds new coverage with little to no code change.

This project was built with the assistance of **Claude AI (Pro)** and is intended as a demonstration of test automation practice for a job application with KlipBoard.

**Test designer:** Jonathan Ruddick

## Project structure

```
pages/          Page objects (one per page, built from a typed data row)
test-data/      JSON test data consumed by the specs
fixture/        Custom Playwright fixtures wiring page objects together
tests/          Data-driven spec files
utility/        Shared test helpers (e.g. accessibility.ts)
```

## Getting started

```bash
npm install
npx playwright install
npm test
```

Other useful scripts:

| Script                | What it does                      |
|------------------------|------------------------------------|
| `npm run test:headed`  | Run tests with the browser visible |
| `npm run test:debug`   | Run tests in debug mode            |
| `npm run test:ui`      | Run tests in Playwright's UI mode  |
| `npm run test:accessibility` | Run only the accessibility spec |
| `npm run report`       | Open the last HTML test report     |
| `npm run allure:generate` | Build the Allure HTML report from the latest run |
| `npm run allure:open`  | Open the last built Allure report  |

## Browser coverage

Tests run against **Chromium** and **Firefox**. WebKit is currently disabled — see the note in `playwright.config.ts` for why.

## Accessibility testing

`tests/accessibility.spec.ts` runs an axe-core scan against every page in `test-data/home.json` and writes an HTML report to `accessibility-reports/` per page. These tests always pass — they're informational for now, publishing a baseline for a human to review rather than failing the build on any violation.

## Allure reporting

Every test run also writes raw results to `allure-results/` (via the `allure-playwright` reporter in `playwright.config.ts`). To view them as a report:

```bash
npm run allure:generate
npm run allure:open
```

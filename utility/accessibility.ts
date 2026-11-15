// Shared accessibility scan helper, built on axe-core.
import { Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { createHtmlReport } from 'axe-html-reporter';

// Runs an axe scan and writes an HTML report. Deliberately does not assert
// zero violations: this first pass is about establishing a baseline for a
// human to review, not gating the build. Add an assertion here once that
// baseline has been reviewed and a target has been agreed.
export async function generateAccessibilityReport(page: Page, reportFileName: string): Promise<void> {
  const results = await new AxeBuilder({ page }).analyze();

  createHtmlReport({
    results,
    options: {
      outputDir: 'accessibility-reports',
      reportFileName,
    },
  });
}

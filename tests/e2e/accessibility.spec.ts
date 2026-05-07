import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import path from "node:path";

const samplePdf = path.resolve("tests/fixtures/sample.pdf");
const encryptedPdf = path.resolve("tests/fixtures/encrypted.pdf");

async function uploadPdf(page: Page, filePath: string) {
  await page.getByTestId("editor-upload-input").setInputFiles(filePath);
}

async function waitForEditorReady(page: Page) {
  await expect(page.getByTestId("editor-root")).toHaveAttribute("data-operation", "idle");
  await expect(page.getByTestId("editor-page-grid")).toBeVisible();
}

async function expectNoAccessibilityViolations(page: Page, options: { include?: string[] } = {}) {
  let builder = new AxeBuilder({ page }).disableRules(["color-contrast"]);

  for (const selector of options.include ?? []) {
    builder = builder.include(selector);
  }

  const results = await builder.analyze();
  expect(results.violations).toEqual([]);
}

for (const route of ["/", "/about", "/features", "/faq", "/privacy", "/terms"]) {
  test(`public page ${route} has no accessibility violations`, async ({ page }) => {
    await page.goto(route);
    await expectNoAccessibilityViolations(page);
  });
}

test("app upload surface has no accessibility violations", async ({ page }) => {
  await page.goto("/app");

  await expectNoAccessibilityViolations(page, {
    include: ["[data-testid='editor-upload-dropzone']", "[data-testid='editor-upload-status']"],
  });
});

test("password prompt modal has no accessibility violations", async ({ page }) => {
  await page.goto("/app");
  await uploadPdf(page, encryptedPdf);

  await expect(page.getByRole("dialog")).toBeVisible();
  await expectNoAccessibilityViolations(page, { include: ["[role='dialog']"] });
});

test("editor grid, selection semantics, and live regions have no accessibility violations", async ({
  page,
}) => {
  await page.goto("/app");
  await uploadPdf(page, samplePdf);
  await waitForEditorReady(page);
  await expect(page.getByTestId("editor-toast").last()).toBeVisible();

  await expectNoAccessibilityViolations(page, {
    include: [
      "[data-testid='editor-page-grid']",
      "[data-testid='editor-status-bar']",
      "[data-testid='editor-toast-region']",
    ],
  });
});

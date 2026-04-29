import { expect, test } from "@playwright/test";
import path from "node:path";

const samplePdf = path.resolve("tests/fixtures/sample.pdf");
const encryptedPdf = path.resolve("tests/fixtures/encrypted.pdf");

async function uploadPdf(page: import("@playwright/test").Page, filePath: string) {
  await page.getByTestId("editor-upload-input").setInputFiles(filePath);
}

async function waitForEditorReady(page: import("@playwright/test").Page) {
  await expect(page.getByTestId("editor-root")).toHaveAttribute("data-operation", "idle");
  await expect(page.getByTestId("editor-page-grid")).toBeVisible();
}

test("uploads a PDF and enters the editor", async ({ page }) => {
  await page.goto("/app");

  await uploadPdf(page, samplePdf);

  await waitForEditorReady(page);
  await expect(page.getByTestId("editor-status-message")).toContainText("Ready");
  await expect(page.getByTestId("editor-page-tile")).toHaveCount(2);
});

test("rotates, deletes, extracts, and downloads", async ({ page }) => {
  await page.goto("/app");
  await uploadPdf(page, samplePdf);
  await waitForEditorReady(page);

  const firstTile = page.getByTestId("editor-page-tile").first();
  await firstTile.click();
  await page.getByTestId("editor-page-rotate-button").first().click();
  await expect(page.getByTestId("editor-status-message")).toContainText("Rotated");

  // After a 90° rotation the canvas-container should switch to landscape aspect-ratio
  const canvasContainer = firstTile.locator('[data-testid="editor-page-canvas"]');
  await expect(canvasContainer).toHaveCSS("aspect-ratio", "4 / 3");

  await page.getByTestId("editor-delete-button").click();
  await expect(firstTile).toHaveAttribute("data-marked-for-deletion", "true");

  const extractPromise = page.waitForEvent("download");
  await page.getByTestId("editor-extract-button").click();
  const extract = await extractPromise;
  expect(extract.suggestedFilename()).toBe("quire-extract.pdf");
  await expect(page.getByTestId("editor-toast").last()).toContainText(
    "Extracted PDF download started."
  );

  const downloadPromise = page.waitForEvent("download");
  await page.getByTestId("editor-download-button").click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe("quire-output.pdf");
});

test("adds another PDF to the current session", async ({ page }) => {
  await page.goto("/app");
  await uploadPdf(page, samplePdf);
  await waitForEditorReady(page);

  await page.getByTestId("editor-add-pdf-input").setInputFiles(samplePdf);
  await expect(page.getByTestId("editor-root")).toHaveAttribute("data-operation", "idle");
  await expect(page.getByTestId("editor-page-tile")).toHaveCount(4);
  await expect(page.getByTestId("editor-toast").last()).toContainText("Added 2 pages");
});

test("prompts for encrypted PDFs and accepts the correct password", async ({ page }) => {
  await page.goto("/app");
  await uploadPdf(page, encryptedPdf);

  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByPlaceholder("Enter password").fill("623");
  await page.getByRole("button", { name: "Unlock" }).click();

  await waitForEditorReady(page);
  await expect(page.getByTestId("editor-page-tile")).toHaveCount(1);
});

test("keeps the password prompt open after a wrong password and allows retry", async ({ page }) => {
  await page.goto("/app");
  await uploadPdf(page, encryptedPdf);

  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByPlaceholder("Enter password").fill("wrong");
  await page.getByRole("button", { name: "Unlock" }).click();
  await expect(page.getByText("Incorrect password. Try again.")).toBeVisible();

  await page.getByPlaceholder("Enter password").fill("623");
  await page.getByRole("button", { name: "Unlock" }).click();

  await waitForEditorReady(page);
  await expect(page.getByTestId("editor-page-tile")).toHaveCount(1);
});

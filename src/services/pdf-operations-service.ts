import { PDFDocument, degrees } from "pdf-lib";
import { EXTRACT_FILENAME, OUTPUT_FILENAME } from "../constants";
import type {
  PageState,
  PDFOperationResult,
  IPDFOperationsService,
  PDFBuildProgress,
} from "../types/interfaces";

export class PDFOperationsService implements IPDFOperationsService {
  // Class-level cache: avoids re-reading the same File on multiple build/extract
  // calls within one session. Cleared on session reset via clearCache().
  private sourceDocCache = new Map<File, PDFDocument>();

  clearCache(): void {
    this.sourceDocCache.clear();
  }

  private async loadSourceDoc(file: File): Promise<PDFDocument> {
    const buffer = await file.arrayBuffer();
    // ignoreEncryption: true is a no-op for unencrypted PDFs and allows loading
    // owner-password PDFs. For user-password PDFs, content streams remain encrypted
    // (pdf-lib has no decryption support), so output quality is not guaranteed.
    return PDFDocument.load(buffer, { ignoreEncryption: true });
  }

  async buildPDF(
    pages: PageState[],
    onProgress?: (progress: PDFBuildProgress) => void
  ): Promise<PDFOperationResult> {
    const activePages = pages.filter((p) => !p.markedForDeletion);
    if (activePages.length === 0) {
      throw new Error("No pages to include in the PDF");
    }

    const outputDoc = await PDFDocument.create();

    for (const [index, page] of activePages.entries()) {
      if (!this.sourceDocCache.has(page.sourceFile)) {
        this.sourceDocCache.set(page.sourceFile, await this.loadSourceDoc(page.sourceFile));
      }
      const sourceDoc = this.sourceDocCache.get(page.sourceFile)!;

      const [copiedPage] = await outputDoc.copyPages(sourceDoc, [page.sourcePageNumber - 1]);
      if (page.rotation !== 0) {
        copiedPage.setRotation(degrees(page.rotation));
      }
      outputDoc.addPage(copiedPage);
      onProgress?.({ completed: index + 1, total: activePages.length });
    }

    const data = await outputDoc.save();
    return {
      data: new Uint8Array(data),
      suggestedFileName: OUTPUT_FILENAME,
    };
  }

  async buildPDFFromSubset(
    pages: PageState[],
    indices: number[],
    onProgress?: (progress: PDFBuildProgress) => void
  ): Promise<PDFOperationResult> {
    const subset = indices.map((i) => pages[i]).filter(Boolean);
    if (subset.length === 0) {
      throw new Error("No pages selected for extraction");
    }

    const outputDoc = await PDFDocument.create();

    for (const [index, page] of subset.entries()) {
      if (!this.sourceDocCache.has(page.sourceFile)) {
        this.sourceDocCache.set(page.sourceFile, await this.loadSourceDoc(page.sourceFile));
      }
      const sourceDoc = this.sourceDocCache.get(page.sourceFile)!;

      const [copiedPage] = await outputDoc.copyPages(sourceDoc, [page.sourcePageNumber - 1]);
      if (page.rotation !== 0) {
        copiedPage.setRotation(degrees(page.rotation));
      }
      outputDoc.addPage(copiedPage);
      onProgress?.({ completed: index + 1, total: subset.length });
    }

    const data = await outputDoc.save();
    return {
      data: new Uint8Array(data),
      suggestedFileName: EXTRACT_FILENAME,
    };
  }
}

export const pdfOperationsService = new PDFOperationsService();

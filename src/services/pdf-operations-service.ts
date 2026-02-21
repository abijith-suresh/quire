import { PDFDocument, degrees } from "pdf-lib";
import type { PageState, PDFOperationResult, IPDFOperationsService } from "../types/interfaces";

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

  async buildPDF(pages: PageState[]): Promise<PDFOperationResult> {
    const activePages = pages.filter((p) => !p.markedForDeletion);
    if (activePages.length === 0) {
      throw new Error("No pages to include in the PDF");
    }

    const outputDoc = await PDFDocument.create();

    for (const page of activePages) {
      if (!this.sourceDocCache.has(page.sourceFile)) {
        this.sourceDocCache.set(page.sourceFile, await this.loadSourceDoc(page.sourceFile));
      }
      const sourceDoc = this.sourceDocCache.get(page.sourceFile)!;

      const [copiedPage] = await outputDoc.copyPages(sourceDoc, [page.sourcePageNumber - 1]);
      if (page.rotation !== 0) {
        copiedPage.setRotation(degrees(page.rotation));
      }
      outputDoc.addPage(copiedPage);
    }

    const data = await outputDoc.save();
    return {
      data: new Uint8Array(data),
      suggestedFileName: "pasta-output.pdf",
    };
  }

  async buildPDFFromSubset(pages: PageState[], indices: number[]): Promise<PDFOperationResult> {
    const subset = indices.map((i) => pages[i]).filter(Boolean);
    if (subset.length === 0) {
      throw new Error("No pages selected for extraction");
    }

    const outputDoc = await PDFDocument.create();

    for (const page of subset) {
      if (!this.sourceDocCache.has(page.sourceFile)) {
        this.sourceDocCache.set(page.sourceFile, await this.loadSourceDoc(page.sourceFile));
      }
      const sourceDoc = this.sourceDocCache.get(page.sourceFile)!;

      const [copiedPage] = await outputDoc.copyPages(sourceDoc, [page.sourcePageNumber - 1]);
      if (page.rotation !== 0) {
        copiedPage.setRotation(degrees(page.rotation));
      }
      outputDoc.addPage(copiedPage);
    }

    const data = await outputDoc.save();
    return {
      data: new Uint8Array(data),
      suggestedFileName: "pasta-extract.pdf",
    };
  }
}

export const pdfOperationsService = new PDFOperationsService();

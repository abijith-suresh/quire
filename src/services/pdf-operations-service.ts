import { PDFDocument, StandardFonts, degrees } from "pdf-lib";
import { EXTRACT_FILENAME, OUTPUT_FILENAME, PAGE_NUMBERS_FILENAME } from "../constants";
import type {
  PageNumberOptions,
  PageState,
  PDFOperationResult,
  IPDFOperationsService,
  PDFBuildProgress,
} from "../types/interfaces";

export class PDFOperationsService implements IPDFOperationsService {
  // Class-level cache: avoids re-reading the same File on multiple build/extract
  // calls within one session. Cleared on session reset via clearCache().
  private sourceDocCache = new Map<File, PDFDocument>();

  /**
   * Clears cached source documents for the current editor session.
   *
   * @returns Nothing.
   */
  clearCache(): void {
    this.sourceDocCache.clear();
  }

  /**
   * Builds a new PDF from every page that is not marked for deletion.
   *
   * @param pages - The current editor page state to export.
   * @param onProgress - Optional callback invoked after each page is copied.
   * @returns The generated PDF bytes and a suggested download filename.
   * @throws {Error} When there are no active pages to include in the output.
   */
  async buildPDF(
    pages: PageState[],
    onProgress?: (progress: PDFBuildProgress) => void
  ): Promise<PDFOperationResult> {
    const activePages = pages.filter((page) => !page.markedForDeletion);

    return this.buildOutputFromPages(
      activePages,
      "No pages to include in the PDF",
      OUTPUT_FILENAME,
      onProgress
    );
  }

  /**
   * Builds a new PDF from a subset of the current editor pages.
   *
   * @param pages - The full editor page state for the current session.
   * @param indices - The page indices to include in the extracted output.
   * @param onProgress - Optional callback invoked after each selected page is copied.
   * @returns The generated PDF bytes and a suggested extract filename.
   * @throws {Error} When the requested subset resolves to no exportable pages.
   */
  async buildPDFFromSubset(
    pages: PageState[],
    indices: number[],
    onProgress?: (progress: PDFBuildProgress) => void
  ): Promise<PDFOperationResult> {
    const subsetPages = indices
      .map((index) => pages[index])
      .filter((page): page is PageState => Boolean(page));

    return this.buildOutputFromPages(
      subsetPages,
      "No pages selected for extraction",
      EXTRACT_FILENAME,
      onProgress
    );
  }

  /**
   * Builds a new PDF with page numbers applied to each active page.
   *
   * @param pages - The current editor page state to export.
   * @param options - The page-number placement and formatting options.
   * @returns The generated PDF bytes and a suggested download filename.
   * @throws {Error} When there are no active pages to include in the output.
   */
  async addPageNumbers(
    pages: PageState[],
    options: PageNumberOptions
  ): Promise<PDFOperationResult> {
    const activePages = pages.filter((page) => !page.markedForDeletion);

    if (activePages.length === 0) {
      throw new Error("No pages to include in the PDF");
    }

    const outputDoc = await PDFDocument.create();
    const font = await outputDoc.embedFont(StandardFonts.Helvetica);

    for (const [index, page] of activePages.entries()) {
      const sourceDoc = await this.getOrLoadSourceDoc(page.sourceFile);
      const [copiedPage] = await outputDoc.copyPages(sourceDoc, [page.sourcePageNumber - 1]);

      if (page.rotation !== 0) {
        copiedPage.setRotation(degrees(page.rotation));
      }

      const number = options.startNumber + index;
      const text = this.formatPageNumber(number, activePages.length, options.format);
      const { width, height } = copiedPage.getSize();
      const textWidth = font.widthOfTextAtSize(text, options.fontSize);
      const margin = 24;
      const x =
        options.position === "bottom-center"
          ? (width - textWidth) / 2
          : options.position === "bottom-left"
            ? margin
            : width - textWidth - margin;
      const y = options.position === "top-right" ? height - options.fontSize - margin : margin;

      copiedPage.drawText(text, {
        x,
        y,
        size: options.fontSize,
        font,
      });

      outputDoc.addPage(copiedPage);
    }

    const data = await outputDoc.save();

    return {
      data: new Uint8Array(data),
      suggestedFileName: PAGE_NUMBERS_FILENAME,
    };
  }

  private async buildOutputFromPages(
    pagesToBuild: PageState[],
    emptyStateMessage: string,
    suggestedFileName: string,
    onProgress?: (progress: PDFBuildProgress) => void
  ): Promise<PDFOperationResult> {
    if (pagesToBuild.length === 0) {
      throw new Error(emptyStateMessage);
    }

    const outputDoc = await PDFDocument.create();

    for (const [index, page] of pagesToBuild.entries()) {
      const sourceDoc = await this.getOrLoadSourceDoc(page.sourceFile);
      const [copiedPage] = await outputDoc.copyPages(sourceDoc, [page.sourcePageNumber - 1]);

      if (page.rotation !== 0) {
        copiedPage.setRotation(degrees(page.rotation));
      }

      outputDoc.addPage(copiedPage);
      onProgress?.({ completed: index + 1, total: pagesToBuild.length });
    }

    const data = await outputDoc.save();

    return {
      data: new Uint8Array(data),
      suggestedFileName,
    };
  }

  private formatPageNumber(
    number: number,
    totalPages: number,
    format: PageNumberOptions["format"]
  ): string {
    switch (format) {
      case "page-number":
        return `Page ${number}`;
      case "number-of-total":
        return `${number} / ${totalPages}`;
      default:
        return `${number}`;
    }
  }

  private async getOrLoadSourceDoc(file: File): Promise<PDFDocument> {
    const cachedDocument = this.sourceDocCache.get(file);
    if (cachedDocument) {
      return cachedDocument;
    }

    const buffer = await file.arrayBuffer();
    // ignoreEncryption: true is a no-op for unencrypted PDFs and allows loading
    // owner-password PDFs. For user-password PDFs, content streams remain encrypted
    // (pdf-lib has no decryption support), so output quality is not guaranteed.
    const sourceDoc = await PDFDocument.load(buffer, { ignoreEncryption: true });
    this.sourceDocCache.set(file, sourceDoc);
    return sourceDoc;
  }
}

export const pdfOperationsService = new PDFOperationsService();

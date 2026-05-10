import { PDFDocument, degrees, PageSizes } from "pdf-lib";
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

  /**
   * Creates a single-page blank PDF file with the given dimensions.
   *
   * @param width - Page width in points (defaults to US Letter width).
   * @param height - Page height in points (defaults to US Letter height).
   * @returns A File containing a one-page blank PDF.
   */
  async createBlankPageFile(
    width: number = PageSizes.Letter[0],
    height: number = PageSizes.Letter[1]
  ): Promise<File> {
    const doc = await PDFDocument.create();
    doc.addPage([width, height]);
    const data = await doc.save();
    const blob = new Blob([new Uint8Array(data)], { type: "application/pdf" });
    return new File([blob], "blank.pdf", { type: "application/pdf" });
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

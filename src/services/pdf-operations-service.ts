import { PDFDocument, degrees } from "pdf-lib";
import { EXTRACT_FILENAME, IMAGES_OUTPUT_FILENAME, OUTPUT_FILENAME } from "../constants";
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

  /**
   * Converts one or more PNG or JPEG images into a PDF document.
   *
   * @param files - The image files to embed as PDF pages.
   * @returns The generated PDF bytes and a suggested download filename.
   * @throws {Error} When no supported image files are provided.
   */
  async imagesToPDF(files: File[]): Promise<PDFOperationResult> {
    const supportedFiles = files.filter(
      (file) => file.type === "image/png" || file.type === "image/jpeg"
    );

    if (supportedFiles.length === 0) {
      throw new Error("No supported images selected for conversion");
    }

    const outputDoc = await PDFDocument.create();

    for (const file of supportedFiles) {
      const bytes = await file.arrayBuffer();
      const image =
        file.type === "image/png"
          ? await outputDoc.embedPng(bytes)
          : await outputDoc.embedJpg(bytes);
      const dimensions = image.scale(1);
      const page = outputDoc.addPage([dimensions.width, dimensions.height]);

      page.drawImage(image, {
        x: 0,
        y: 0,
        width: dimensions.width,
        height: dimensions.height,
      });
    }

    const data = await outputDoc.save();

    return {
      data: new Uint8Array(data),
      suggestedFileName: IMAGES_OUTPUT_FILENAME,
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

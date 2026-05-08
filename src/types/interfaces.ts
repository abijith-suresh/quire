export type EncryptionReason = "needs-password" | "wrong-password";

export class PDFPasswordRequiredError extends Error {
  readonly file: File;
  readonly reason: EncryptionReason;

  constructor(file: File, reason: EncryptionReason = "needs-password") {
    super(`PDF requires a password: ${file.name}`);
    this.name = "PDFPasswordRequiredError";
    this.file = file;
    this.reason = reason;
  }
}

export interface PDFPageInfo {
  pageNumber: number;
  width: number;
  height: number;
}

export interface PDFDocumentMetadata {
  title: string;
  author: string;
  subject: string;
  keywords: string;
}

export interface PageState {
  id: string;
  sourceFile: File;
  sourcePageNumber: number;
  rotation: number;
  markedForDeletion: boolean;
}

export interface PDFOperationResult {
  data: Uint8Array;
  suggestedFileName: string;
}

export interface PDFBuildProgress {
  completed: number;
  total: number;
}

export interface IPDFOperationsService {
  /**
   * Builds a new PDF from every page that is not marked for deletion.
   *
   * @param pages - The current editor page state to export.
   * @param onProgress - Optional callback invoked after each page is copied.
   * @returns The generated PDF bytes and a suggested download filename.
   * @throws {Error} When there are no active pages to include in the output.
   */
  buildPDF(
    pages: PageState[],
    onProgress?: (progress: PDFBuildProgress) => void
  ): Promise<PDFOperationResult>;

  /**
   * Builds a new PDF from a subset of the current editor pages.
   *
   * @param pages - The full editor page state for the current session.
   * @param indices - The page indices to include in the extracted output.
   * @param onProgress - Optional callback invoked after each selected page is copied.
   * @returns The generated PDF bytes and a suggested extract filename.
   * @throws {Error} When the requested subset resolves to no exportable pages.
   */
  buildPDFFromSubset(
    pages: PageState[],
    indices: number[],
    onProgress?: (progress: PDFBuildProgress) => void
  ): Promise<PDFOperationResult>;

  /**
   * Builds a new PDF and applies document metadata to the output.
   *
   * @param pages - The current editor page state to export.
   * @param metadata - The metadata values to apply to the output document.
   * @param onProgress - Optional callback invoked after each page is copied.
   * @returns The generated PDF bytes and a suggested download filename.
   * @throws {Error} When there are no active pages to include in the output.
   */
  buildPDFWithMetadata(
    pages: PageState[],
    metadata: PDFDocumentMetadata,
    onProgress?: (progress: PDFBuildProgress) => void
  ): Promise<PDFOperationResult>;

  /**
   * Clears any cached source documents held for the current editor session.
   *
   * @returns Nothing.
   */
  clearCache(): void;
}

export interface IPDFRenderer {
  /**
   * Renders a PDF page to the provided canvas element.
   *
   * @param file - The source PDF file to render from.
   * @param pageNumber - The 1-based page number to render.
   * @param canvas - The destination canvas element.
   * @param scale - The render scale multiplier.
   * @param rotation - Optional clockwise rotation in degrees.
   * @returns A promise that resolves after rendering completes.
   * @throws {Error} When the canvas context cannot be created.
   * @throws {PDFPasswordRequiredError} When the source PDF requires a password.
   */
  renderPage(
    file: File,
    pageNumber: number,
    canvas: HTMLCanvasElement,
    scale: number,
    rotation?: number
  ): Promise<void>;

  /**
   * Reads the natural dimensions of a page from the source PDF.
   *
   * @param file - The source PDF file to inspect.
   * @param pageNumber - The 1-based page number to inspect.
   * @returns The page number and viewport dimensions at scale 1.
   * @throws {PDFPasswordRequiredError} When the source PDF requires a password.
   */
  getPageInfo(file: File, pageNumber: number): Promise<PDFPageInfo>;
}

export interface IPDFLoader {
  /**
   * Loads a PDF into the active session without an explicit password.
   *
   * @param file - The PDF file to load.
   * @returns A promise that resolves when the file is ready for use.
   * @throws {PDFPasswordRequiredError} When the PDF is user-password protected.
   */
  loadPDF(file: File): Promise<void>;

  /**
   * Returns the page count for the currently active PDF.
   *
   * @returns The active document page count, or 0 when nothing is loaded.
   */
  getPageCount(): number;

  /**
   * Returns the filename for the currently active PDF.
   *
   * @returns The active filename, or an empty string when nothing is loaded.
   */
  getFileName(): string;

  /**
   * Reports whether an active PDF session is currently loaded.
   *
   * @returns `true` when an active document is loaded, otherwise `false`.
   */
  isLoaded(): boolean;

  /**
   * Unloads the active PDF and clears its session-specific password state.
   *
   * @returns Nothing.
   */
  unload(): void;

  /**
   * Clears the full PDF session, including cached documents and passwords.
   *
   * @returns Nothing.
   */
  reset(): void;
}

export interface IPDFService extends IPDFLoader, IPDFRenderer {
  /**
   * Loads a password-protected PDF using the supplied password.
   *
   * @param file - The PDF file to load.
   * @param password - The password to try for the document.
   * @returns A promise that resolves when the file is ready for use.
   * @throws {PDFPasswordRequiredError} When the password is missing or incorrect.
   */
  loadPDFWithPassword(file: File, password: string): Promise<void>;

  /**
   * Returns metadata for the requested PDF file.
   *
   * @param file - The PDF file whose metadata should be read.
   * @returns The title, author, subject, and keywords currently stored in the document.
   * @throws {PDFPasswordRequiredError} When the source PDF requires a password.
   */
  getMetadata(file: File): Promise<PDFDocumentMetadata>;

  /**
   * Returns the cached password previously used for a file in this session.
   *
   * @param file - The PDF file whose cached password should be read.
   * @returns The cached password, or `undefined` when none is stored.
   */
  getPassword(file: File): string | undefined;

  /**
   * Clears every cached password stored for the current session.
   *
   * @returns Nothing.
   */
  clearPasswordRegistry(): void;
}

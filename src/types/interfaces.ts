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

export interface PDFLoadedEvent {
  fileName: string;
  pageCount: number;
  file: File;
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
  buildPDF(
    pages: PageState[],
    onProgress?: (progress: PDFBuildProgress) => void
  ): Promise<PDFOperationResult>;
  buildPDFFromSubset(
    pages: PageState[],
    indices: number[],
    onProgress?: (progress: PDFBuildProgress) => void
  ): Promise<PDFOperationResult>;
  clearCache(): void;
}

export interface IPDFRenderer {
  renderPage(pageNumber: number, canvas: HTMLCanvasElement, scale: number): Promise<void>;
  getPageInfo(pageNumber: number): Promise<PDFPageInfo>;
}

export interface IPDFLoader {
  loadPDF(file: File): Promise<void>;
  getPageCount(): number;
  getFileName(): string;
  isLoaded(): boolean;
  unload(): void;
}

export interface IPDFService extends IPDFLoader, IPDFRenderer {
  dispatchLoadedEvent(): void;
  loadPDFWithPassword(file: File, password: string): Promise<void>;
  getPassword(file: File): string | undefined;
  clearPasswordRegistry(): void;
}

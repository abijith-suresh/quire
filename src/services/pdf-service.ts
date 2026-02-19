import { PDFDocument } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import type { PDFPageInfo, IPDFService, PDFLoadedEvent } from '../types/interfaces';
import { PDFPasswordRequiredError } from '../types/interfaces';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

export class PDFService implements IPDFService {
  private pdfDocument: PDFDocument | null = null;
  private pdfjsDocument: pdfjsLib.PDFDocumentProxy | null = null;
  private fileName: string = '';
  private arrayBuffer: ArrayBuffer | null = null;
  private currentFile: File | null = null;
  private passwordRegistry = new Map<File, string>();

  async loadPDF(file: File): Promise<void> {
    const buffer = await file.arrayBuffer();
    this.arrayBuffer = buffer;
    this.fileName = file.name;
    this.currentFile = file;

    const typedArray = new Uint8Array(buffer);

    try {
      // Attempt normal load — throws EncryptedPDFError for any encrypted PDF
      this.pdfDocument = await PDFDocument.load(buffer);
    } catch (error) {
      if (error instanceof Error && error.message.includes('is encrypted')) {
        // Bypass pdf-lib's encryption guard (no decryption; content streams stay encrypted
        // for user-password PDFs, but owner-password PDFs often work fine in practice)
        this.pdfDocument = await PDFDocument.load(buffer, { ignoreEncryption: true });

        try {
          // pdf.js performs actual decryption — try with an empty user password first
          this.pdfjsDocument = await pdfjsLib.getDocument({ data: typedArray, password: '' })
            .promise;
          // Success: this is an owner-password PDF (empty user password)
          this.passwordRegistry.set(file, '');
          return;
        } catch (pdfjsError) {
          if (pdfjsError instanceof Error && pdfjsError.name === 'PasswordException') {
            // Truly locked: requires a real user password
            this.pdfDocument = null;
            this.pdfjsDocument = null;
            this.arrayBuffer = null;
            this.currentFile = null;
            this.fileName = '';
            throw new PDFPasswordRequiredError(file, 'needs-password');
          }
          throw pdfjsError;
        }
      }
      throw error;
    }

    // Unencrypted PDF: load with pdf.js normally
    this.pdfjsDocument = await pdfjsLib.getDocument({ data: typedArray }).promise;
  }

  async loadPDFWithPassword(file: File, password: string): Promise<void> {
    const buffer = await file.arrayBuffer();
    this.arrayBuffer = buffer;
    this.fileName = file.name;
    this.currentFile = file;

    const typedArray = new Uint8Array(buffer);

    // pdf-lib: bypass encryption guard (no decryption capability in pdf-lib)
    this.pdfDocument = await PDFDocument.load(buffer, { ignoreEncryption: true });

    try {
      // pdf.js: actual decryption happens here with the provided password
      this.pdfjsDocument = await pdfjsLib.getDocument({ data: typedArray, password }).promise;
    } catch (e) {
      if (e instanceof Error && e.name === 'PasswordException') {
        this.pdfDocument = null;
        this.pdfjsDocument = null;
        this.arrayBuffer = null;
        this.currentFile = null;
        this.fileName = '';
        throw new PDFPasswordRequiredError(file, 'wrong-password');
      }
      throw e;
    }

    this.passwordRegistry.set(file, password);
  }

  getPassword(file: File): string | undefined {
    return this.passwordRegistry.get(file);
  }

  getPageCount(): number {
    return this.pdfDocument?.getPageCount() ?? 0;
  }

  getFileName(): string {
    return this.fileName;
  }

  getPDFDocument(): PDFDocument | null {
    return this.pdfDocument;
  }

  async renderPage(
    pageNumber: number,
    canvas: HTMLCanvasElement,
    scale: number = 1.5
  ): Promise<void> {
    if (!this.pdfjsDocument) {
      throw new Error('No PDF loaded');
    }

    const page = await this.pdfjsDocument.getPage(pageNumber);
    const viewport = page.getViewport({ scale });

    canvas.width = viewport.width;
    canvas.height = viewport.height;

    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Could not get canvas context');
    }

    await page.render({
      canvasContext: context,
      viewport: viewport,
      canvas: canvas,
    }).promise;
  }

  async getPageInfo(pageNumber: number): Promise<PDFPageInfo> {
    if (!this.pdfjsDocument) {
      throw new Error('No PDF loaded');
    }

    const page = await this.pdfjsDocument.getPage(pageNumber);
    const viewport = page.getViewport({ scale: 1 });

    return {
      pageNumber,
      width: viewport.width,
      height: viewport.height,
    };
  }

  isLoaded(): boolean {
    return this.pdfDocument !== null && this.pdfjsDocument !== null;
  }

  unload(): void {
    if (this.currentFile) {
      this.passwordRegistry.delete(this.currentFile);
    }
    this.pdfDocument = null;
    this.pdfjsDocument = null;
    this.fileName = '';
    this.arrayBuffer = null;
    this.currentFile = null;
  }

  getFile(): File | null {
    return this.currentFile;
  }

  dispatchLoadedEvent(): void {
    if (!this.currentFile) return;
    const event = new CustomEvent<PDFLoadedEvent>('pdf-loaded', {
      detail: {
        fileName: this.fileName,
        pageCount: this.getPageCount(),
        file: this.currentFile,
      },
    });
    document.dispatchEvent(event);
  }
}

export const pdfService = new PDFService();

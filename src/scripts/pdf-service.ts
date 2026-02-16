import { PDFDocument } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

export interface PDFPageInfo {
  pageNumber: number;
  width: number;
  height: number;
}

class PDFService {
  private pdfDocument: PDFDocument | null = null;
  private pdfjsDocument: pdfjsLib.PDFDocumentProxy | null = null;
  private fileName: string = '';
  private arrayBuffer: ArrayBuffer | null = null;

  async loadPDF(file: File): Promise<void> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = async () => {
        try {
          this.arrayBuffer = reader.result as ArrayBuffer;
          this.fileName = file.name;

          // Load with pdf-lib for manipulation
          this.pdfDocument = await PDFDocument.load(this.arrayBuffer);

          // Load with pdf.js for rendering
          const typedArray = new Uint8Array(this.arrayBuffer);
          this.pdfjsDocument = await pdfjsLib.getDocument({ data: typedArray }).promise;

          resolve();
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = () => reject(reader.error);
      reader.readAsArrayBuffer(file);
    });
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
    this.pdfDocument = null;
    this.pdfjsDocument = null;
    this.fileName = '';
    this.arrayBuffer = null;
  }
}

export const pdfService = new PDFService();

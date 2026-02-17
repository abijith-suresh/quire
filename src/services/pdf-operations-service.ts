import { PDFDocument, degrees } from 'pdf-lib';
import type { PageState, PDFOperationResult, IPDFOperationsService } from '../types/interfaces';

export class PDFOperationsService implements IPDFOperationsService {
  private async loadSourceDoc(file: File): Promise<PDFDocument> {
    const buffer = await file.arrayBuffer();
    return PDFDocument.load(buffer);
  }

  async buildPDF(pages: PageState[]): Promise<PDFOperationResult> {
    const activePages = pages.filter((p) => !p.markedForDeletion);
    if (activePages.length === 0) {
      throw new Error('No pages to include in the PDF');
    }

    const outputDoc = await PDFDocument.create();
    const sourceDocCache = new Map<File, PDFDocument>();

    for (const page of activePages) {
      if (!sourceDocCache.has(page.sourceFile)) {
        sourceDocCache.set(page.sourceFile, await this.loadSourceDoc(page.sourceFile));
      }
      const sourceDoc = sourceDocCache.get(page.sourceFile)!;

      const [copiedPage] = await outputDoc.copyPages(sourceDoc, [page.sourcePageNumber - 1]);
      if (page.rotation !== 0) {
        copiedPage.setRotation(degrees(page.rotation));
      }
      outputDoc.addPage(copiedPage);
    }

    const data = await outputDoc.save();
    return {
      data: new Uint8Array(data),
      suggestedFileName: 'pasta-output.pdf',
    };
  }

  async buildPDFFromSubset(pages: PageState[], indices: number[]): Promise<PDFOperationResult> {
    const subset = indices.map((i) => pages[i]).filter(Boolean);
    if (subset.length === 0) {
      throw new Error('No pages selected for extraction');
    }

    const outputDoc = await PDFDocument.create();
    const sourceDocCache = new Map<File, PDFDocument>();

    for (const page of subset) {
      if (!sourceDocCache.has(page.sourceFile)) {
        sourceDocCache.set(page.sourceFile, await this.loadSourceDoc(page.sourceFile));
      }
      const sourceDoc = sourceDocCache.get(page.sourceFile)!;

      const [copiedPage] = await outputDoc.copyPages(sourceDoc, [page.sourcePageNumber - 1]);
      if (page.rotation !== 0) {
        copiedPage.setRotation(degrees(page.rotation));
      }
      outputDoc.addPage(copiedPage);
    }

    const data = await outputDoc.save();
    return {
      data: new Uint8Array(data),
      suggestedFileName: 'pasta-extract.pdf',
    };
  }
}

export const pdfOperationsService = new PDFOperationsService();

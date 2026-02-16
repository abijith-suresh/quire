import type { IPDFService, PDFLoadedEvent } from './interfaces';

export class PDFViewerController {
  private viewer: HTMLDivElement;
  private pdfName: HTMLHeadingElement;
  private pageInfo: HTMLParagraphElement;
  private pagesContainer: HTMLDivElement;
  private pdfService: IPDFService;
  private readonly initialPageLimit: number;

  constructor(
    viewerId: string,
    pdfNameId: string,
    pageInfoId: string,
    pagesContainerId: string,
    pdfService: IPDFService,
    initialPageLimit: number = 5
  ) {
    const viewer = document.getElementById(viewerId);
    const pdfName = document.getElementById(pdfNameId);
    const pageInfo = document.getElementById(pageInfoId);
    const pagesContainer = document.getElementById(pagesContainerId);

    if (!viewer || !pdfName || !pageInfo || !pagesContainer) {
      throw new Error('Required DOM elements not found');
    }

    this.viewer = viewer as HTMLDivElement;
    this.pdfName = pdfName as HTMLHeadingElement;
    this.pageInfo = pageInfo as HTMLParagraphElement;
    this.pagesContainer = pagesContainer as HTMLDivElement;
    this.pdfService = pdfService;
    this.initialPageLimit = initialPageLimit;

    this.attachEventListeners();
  }

  private attachEventListeners(): void {
    document.addEventListener('pdf-loaded', (event) => {
      const customEvent = event as CustomEvent<PDFLoadedEvent>;
      this.handlePDFLoaded(customEvent.detail);
    });
  }

  private async handlePDFLoaded(detail: PDFLoadedEvent): Promise<void> {
    const { fileName, pageCount } = detail;

    this.showViewer(fileName);
    this.updatePageInfo(pageCount);
    this.clearPages();

    const pagesToRender = Math.min(pageCount, this.initialPageLimit);
    await this.renderPages(pagesToRender);
  }

  private showViewer(fileName: string): void {
    this.viewer.style.display = 'block';
    this.pdfName.textContent = fileName;
  }

  private updatePageInfo(pageCount: number): void {
    const pagesToRender = Math.min(pageCount, this.initialPageLimit);
    this.pageInfo.textContent = `Showing ${pagesToRender} of ${pageCount} pages`;
  }

  private clearPages(): void {
    this.pagesContainer.innerHTML = '';
  }

  private async renderPages(pagesToRender: number): Promise<void> {
    for (let i = 1; i <= pagesToRender; i++) {
      await this.renderPage(i);
    }
  }

  private async renderPage(pageNumber: number): Promise<void> {
    const pageWrapper = this.createPageWrapper();
    const canvas = this.createCanvas();
    const pageLabel = this.createPageLabel(pageNumber);

    pageWrapper.appendChild(canvas);
    pageWrapper.appendChild(pageLabel);
    this.pagesContainer.appendChild(pageWrapper);

    try {
      await this.pdfService.renderPage(pageNumber, canvas, 1.0);
    } catch (error) {
      console.error(`Failed to render page ${pageNumber}:`, error);
      pageLabel.textContent = `Page ${pageNumber} (Error)`;
    }
  }

  private createPageWrapper(): HTMLDivElement {
    const pageWrapper = document.createElement('div');
    pageWrapper.className = 'page-wrapper';
    return pageWrapper;
  }

  private createCanvas(): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.className = 'page-canvas';
    return canvas;
  }

  private createPageLabel(pageNumber: number): HTMLSpanElement {
    const pageLabel = document.createElement('span');
    pageLabel.className = 'page-label';
    pageLabel.textContent = `Page ${pageNumber}`;
    return pageLabel;
  }
}

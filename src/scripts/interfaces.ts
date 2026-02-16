export interface PDFPageInfo {
  pageNumber: number;
  width: number;
  height: number;
}

export interface PDFLoadedEvent {
  fileName: string;
  pageCount: number;
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
}

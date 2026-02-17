import type { IPDFService } from '../types/interfaces';

export class PDFUploaderController {
  private dropZone: HTMLDivElement;
  private fileInput: HTMLInputElement;
  private errorMessage: HTMLParagraphElement;
  private pdfService: IPDFService;

  constructor(
    dropZoneId: string,
    fileInputId: string,
    errorMessageId: string,
    pdfService: IPDFService
  ) {
    const dropZone = document.getElementById(dropZoneId);
    const fileInput = document.getElementById(fileInputId);
    const errorMessage = document.getElementById(errorMessageId);

    if (!dropZone || !fileInput || !errorMessage) {
      throw new Error('Required DOM elements not found');
    }

    this.dropZone = dropZone as HTMLDivElement;
    this.fileInput = fileInput as HTMLInputElement;
    this.errorMessage = errorMessage as HTMLParagraphElement;
    this.pdfService = pdfService;

    this.attachEventListeners();
  }

  private attachEventListeners(): void {
    // Click to upload
    this.dropZone.addEventListener('click', () => this.handleClick());
    this.fileInput.addEventListener('change', (e) => this.handleFileSelect(e));

    // Drag and drop
    this.dropZone.addEventListener('dragover', (e) => this.handleDragOver(e));
    this.dropZone.addEventListener('dragleave', () => this.handleDragLeave());
    this.dropZone.addEventListener('drop', (e) => this.handleDrop(e));
  }

  private handleClick(): void {
    this.fileInput.click();
  }

  private handleFileSelect(event: Event): void {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    if (file) {
      this.processFile(file);
    }
  }

  private handleDragOver(event: DragEvent): void {
    event.preventDefault();
    this.dropZone.classList.add('drag-over');
  }

  private handleDragLeave(): void {
    this.dropZone.classList.remove('drag-over');
  }

  private handleDrop(event: DragEvent): void {
    event.preventDefault();
    this.dropZone.classList.remove('drag-over');

    const file = event.dataTransfer?.files[0];
    if (file) {
      this.processFile(file);
    }
  }

  private async processFile(file: File): Promise<void> {
    if (file.type !== 'application/pdf') {
      this.showError('Please upload a valid PDF file');
      return;
    }

    try {
      await this.pdfService.loadPDF(file);
      this.pdfService.dispatchLoadedEvent();
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      this.showError('Failed to load PDF: ' + errorMsg);
    }
  }

  private showError(message: string): void {
    this.errorMessage.textContent = message;
    this.errorMessage.style.display = 'block';
    setTimeout(() => {
      this.errorMessage.style.display = 'none';
    }, 5000);
  }
}

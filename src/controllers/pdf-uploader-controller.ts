import type { IPDFService } from '../types/interfaces';
import { PDFPasswordRequiredError } from '../types/interfaces';
import { promptForPassword } from '../utils/password-prompt';

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

    // Keyboard activation for drop zone (role="button")
    this.dropZone.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        this.handleClick();
      }
    });

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
    } catch (error) {
      if (error instanceof PDFPasswordRequiredError) {
        await this.handleEncryptedFile(file, error.reason === 'wrong-password');
        return;
      }
      this.showError(
        'Failed to load PDF: ' + (error instanceof Error ? error.message : String(error))
      );
      return;
    }

    this.pdfService.dispatchLoadedEvent();
  }

  private async handleEncryptedFile(file: File, isRetry: boolean): Promise<void> {
    const password = await promptForPassword(file.name, isRetry);
    if (password === null) return; // user cancelled

    try {
      await this.pdfService.loadPDFWithPassword(file, password);
    } catch (error) {
      if (error instanceof PDFPasswordRequiredError) {
        // Wrong password — show modal again with retry flag
        await this.handleEncryptedFile(file, true);
        return;
      }
      this.showError(
        'Failed to load PDF: ' + (error instanceof Error ? error.message : String(error))
      );
      return;
    }

    this.pdfService.dispatchLoadedEvent();
  }

  private showError(message: string): void {
    this.errorMessage.textContent = message;
    this.errorMessage.style.visibility = 'visible';
    this.errorMessage.style.height = 'auto';
    this.errorMessage.style.overflow = 'visible';
    setTimeout(() => {
      this.errorMessage.style.visibility = 'hidden';
      this.errorMessage.style.height = '0';
      this.errorMessage.style.overflow = 'hidden';
    }, 5000);
  }
}

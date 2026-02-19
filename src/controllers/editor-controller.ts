import type {
  PageState,
  IPDFService,
  IPDFOperationsService,
  PDFLoadedEvent,
} from '../types/interfaces';
import { PDFPasswordRequiredError } from '../types/interfaces';
import { downloadPDF } from '../utils/download';
import { promptForPassword } from '../utils/password-prompt';

export class EditorController {
  private pages: PageState[] = [];
  private selectedIndices: Set<number> = new Set();
  private pdfService: IPDFService;
  private operationsService: IPDFOperationsService;

  private pagesContainer: HTMLDivElement;
  private toolbar: HTMLDivElement;
  private uploaderSection: HTMLDivElement;
  private editorSection: HTMLDivElement;
  private addPdfInput: HTMLInputElement;

  private dragSourceIndex: number | null = null;
  private renderGeneration = 0;
  private signal: AbortSignal;

  constructor(
    pagesContainerId: string,
    toolbarId: string,
    uploaderSectionId: string,
    editorSectionId: string,
    addPdfInputId: string,
    pdfService: IPDFService,
    operationsService: IPDFOperationsService,
    signal: AbortSignal
  ) {
    this.pdfService = pdfService;
    this.operationsService = operationsService;
    this.signal = signal;

    this.pagesContainer = document.getElementById(pagesContainerId) as HTMLDivElement;
    this.toolbar = document.getElementById(toolbarId) as HTMLDivElement;
    this.uploaderSection = document.getElementById(uploaderSectionId) as HTMLDivElement;
    this.editorSection = document.getElementById(editorSectionId) as HTMLDivElement;
    this.addPdfInput = document.getElementById(addPdfInputId) as HTMLInputElement;

    if (
      !this.pagesContainer ||
      !this.toolbar ||
      !this.uploaderSection ||
      !this.editorSection ||
      !this.addPdfInput
    ) {
      throw new Error('Required DOM elements not found for editor');
    }

    this.attachEventListeners();
  }

  private attachEventListeners(): void {
    document.addEventListener(
      'pdf-loaded',
      (event) => {
        const customEvent = event as CustomEvent<PDFLoadedEvent>;
        this.handlePDFLoaded(customEvent.detail);
      },
      { signal: this.signal }
    );

    this.addPdfInput.addEventListener('change', (e) => this.handleAddPDF(e));

    document.getElementById('btn-add-pdf')?.addEventListener('click', () => {
      this.addPdfInput.click();
    });
    document.getElementById('btn-rotate')?.addEventListener('click', () => {
      this.rotateSelected();
    });
    document.getElementById('btn-delete')?.addEventListener('click', () => {
      this.toggleDeleteSelected();
    });
    document.getElementById('btn-extract')?.addEventListener('click', () => {
      this.extractSelected();
    });
    document.getElementById('btn-download')?.addEventListener('click', () => {
      this.downloadResult();
    });
    document.getElementById('btn-select-all')?.addEventListener('click', () => {
      this.toggleSelectAll();
    });
  }

  private async handlePDFLoaded(detail: PDFLoadedEvent): Promise<void> {
    const { pageCount, file } = detail;

    for (let i = 1; i <= pageCount; i++) {
      this.pages.push({
        id: `${file.name}-${i}-${Date.now()}`,
        sourceFile: file,
        sourcePageNumber: i,
        rotation: 0,
        markedForDeletion: false,
      });
    }

    this.uploaderSection.style.display = 'none';
    this.editorSection.style.display = 'block';
    this.selectedIndices.clear();

    await this.renderAllPages();
  }

  private async handleAddPDF(event: Event): Promise<void> {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    if (!file || file.type !== 'application/pdf') return;

    let loaded = false;
    try {
      await this.pdfService.loadPDF(file);
      loaded = true;
    } catch (error) {
      if (error instanceof PDFPasswordRequiredError) {
        loaded = await this.handleEncryptedAdd(file, error.reason === 'wrong-password');
      } else {
        console.error('Failed to add PDF:', error);
      }
    }

    if (loaded) {
      const pageCount = this.pdfService.getPageCount();
      const startIndex = this.pages.length;
      for (let i = 1; i <= pageCount; i++) {
        this.pages.push({
          id: `${file.name}-${i}-${Date.now()}`,
          sourceFile: file,
          sourcePageNumber: i,
          rotation: 0,
          markedForDeletion: false,
        });
      }
      await this.renderPagesFrom(startIndex);
      this.updatePageCount();
    }

    target.value = '';
  }

  private async handleEncryptedAdd(file: File, isRetry: boolean): Promise<boolean> {
    const password = await promptForPassword(file.name, isRetry);
    if (password === null) return false;

    try {
      await this.pdfService.loadPDFWithPassword(file, password);
      return true;
    } catch (error) {
      if (error instanceof PDFPasswordRequiredError) {
        return this.handleEncryptedAdd(file, true);
      }
      console.error('Failed to load encrypted PDF:', error);
      return false;
    }
  }

  private async renderAllPages(): Promise<void> {
    const gen = ++this.renderGeneration;
    this.pagesContainer.innerHTML = '';

    for (let i = 0; i < this.pages.length; i++) {
      if (gen !== this.renderGeneration) return;
      await this.renderPageThumbnail(i);
    }

    if (gen === this.renderGeneration) {
      this.updatePageCount();
    }
  }

  private async renderPagesFrom(startIndex: number): Promise<void> {
    for (let i = startIndex; i < this.pages.length; i++) {
      await this.renderPageThumbnail(i);
    }
  }

  private async renderPageThumbnail(index: number): Promise<void> {
    const page = this.pages[index];

    const wrapper = document.createElement('div');
    wrapper.className = 'editor-page';
    wrapper.dataset.index = String(index);
    wrapper.draggable = true;
    if (page.markedForDeletion) wrapper.classList.add('marked-deleted');
    if (this.selectedIndices.has(index)) wrapper.classList.add('selected');

    const canvasContainer = document.createElement('div');
    canvasContainer.className = 'canvas-container';
    canvasContainer.style.transform = `rotate(${page.rotation}deg)`;

    const canvas = document.createElement('canvas');
    canvas.className = 'page-canvas';

    canvasContainer.appendChild(canvas);
    wrapper.appendChild(canvasContainer);

    const controls = document.createElement('div');
    controls.className = 'page-controls';

    const label = document.createElement('span');
    label.className = 'page-label';
    label.textContent = `Page ${index + 1}`;

    const rotateBtn = document.createElement('button');
    rotateBtn.className = 'btn-page-rotate';
    rotateBtn.textContent = '\u21BB';
    rotateBtn.title = 'Rotate 90\u00B0';
    rotateBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.rotatePage(index);
    });

    controls.appendChild(label);
    controls.appendChild(rotateBtn);
    wrapper.appendChild(controls);

    // Click to select
    wrapper.addEventListener('click', () => this.toggleSelection(index));

    // Drag events
    wrapper.addEventListener('dragstart', (e) => this.handleDragStart(e, index));
    wrapper.addEventListener('dragover', (e) => this.handleDragOver(e));
    wrapper.addEventListener('dragenter', (e) => this.handleDragEnter(e, wrapper));
    wrapper.addEventListener('dragleave', () => wrapper.classList.remove('drag-over'));
    wrapper.addEventListener('drop', (e) => this.handleDrop(e, index));
    wrapper.addEventListener('dragend', () => this.handleDragEnd());

    this.pagesContainer.appendChild(wrapper);

    // Render the thumbnail using a temporary PDFService load
    try {
      const storedPassword = this.pdfService.getPassword(page.sourceFile);
      if (storedPassword !== undefined) {
        // File was previously unlocked ('' for owner-password, or real password for user-password)
        await this.pdfService.loadPDFWithPassword(page.sourceFile, storedPassword);
      } else {
        await this.pdfService.loadPDF(page.sourceFile);
      }
      await this.pdfService.renderPage(page.sourcePageNumber, canvas, 0.5);
    } catch (error) {
      console.error(`Failed to render page ${index + 1}:`, error);
      label.textContent = `Page ${index + 1} (Error)`;
    }
  }

  private rotatePage(index: number): void {
    const page = this.pages[index];
    page.rotation = (page.rotation + 90) % 360;

    const wrapper = this.pagesContainer.children[index] as HTMLDivElement;
    const canvasContainer = wrapper.querySelector('.canvas-container') as HTMLDivElement;
    if (canvasContainer) {
      canvasContainer.style.transform = `rotate(${page.rotation}deg)`;
    }
  }

  private toggleSelection(index: number): void {
    const wrapper = this.pagesContainer.children[index] as HTMLDivElement;
    if (this.selectedIndices.has(index)) {
      this.selectedIndices.delete(index);
      wrapper.classList.remove('selected');
    } else {
      this.selectedIndices.add(index);
      wrapper.classList.add('selected');
    }
    this.updateToolbarState();
  }

  private toggleSelectAll(): void {
    if (this.selectedIndices.size === this.pages.length) {
      this.selectedIndices.clear();
      this.pagesContainer.querySelectorAll('.editor-page').forEach((el) => {
        el.classList.remove('selected');
      });
    } else {
      for (let i = 0; i < this.pages.length; i++) {
        this.selectedIndices.add(i);
      }
      this.pagesContainer.querySelectorAll('.editor-page').forEach((el) => {
        el.classList.add('selected');
      });
    }
    this.updateToolbarState();
  }

  private rotateSelected(): void {
    if (this.selectedIndices.size === 0) return;
    for (const index of this.selectedIndices) {
      this.rotatePage(index);
    }
  }

  private toggleDeleteSelected(): void {
    if (this.selectedIndices.size === 0) return;
    for (const index of this.selectedIndices) {
      const page = this.pages[index];
      page.markedForDeletion = !page.markedForDeletion;

      const wrapper = this.pagesContainer.children[index] as HTMLDivElement;
      wrapper.classList.toggle('marked-deleted', page.markedForDeletion);
    }
  }

  private async extractSelected(): Promise<void> {
    if (this.selectedIndices.size === 0) return;
    const indices = Array.from(this.selectedIndices).sort((a, b) => a - b);
    try {
      const result = await this.operationsService.buildPDFFromSubset(this.pages, indices);
      downloadPDF(result);
    } catch (error) {
      console.error('Failed to extract pages:', error);
    }
  }

  private async downloadResult(): Promise<void> {
    try {
      const result = await this.operationsService.buildPDF(this.pages);
      downloadPDF(result);
    } catch (error) {
      console.error('Failed to build PDF:', error);
    }
  }

  // Drag and drop reordering
  private handleDragStart(event: DragEvent, index: number): void {
    this.dragSourceIndex = index;
    event.dataTransfer!.effectAllowed = 'move';
    const wrapper = this.pagesContainer.children[index] as HTMLDivElement;
    wrapper.classList.add('dragging');
  }

  private handleDragOver(event: DragEvent): void {
    event.preventDefault();
    event.dataTransfer!.dropEffect = 'move';
  }

  private handleDragEnter(event: DragEvent, wrapper: HTMLDivElement): void {
    event.preventDefault();
    wrapper.classList.add('drag-over');
  }

  private async handleDrop(event: DragEvent, targetIndex: number): Promise<void> {
    event.preventDefault();
    if (this.dragSourceIndex === null || this.dragSourceIndex === targetIndex) return;

    const [movedPage] = this.pages.splice(this.dragSourceIndex, 1);
    this.pages.splice(targetIndex, 0, movedPage);

    // Update selection indices after reorder
    const newSelected = new Set<number>();
    for (const oldIndex of this.selectedIndices) {
      let newIndex = oldIndex;
      if (oldIndex === this.dragSourceIndex) {
        newIndex = targetIndex;
      } else if (
        this.dragSourceIndex < targetIndex &&
        oldIndex > this.dragSourceIndex &&
        oldIndex <= targetIndex
      ) {
        newIndex = oldIndex - 1;
      } else if (
        this.dragSourceIndex > targetIndex &&
        oldIndex >= targetIndex &&
        oldIndex < this.dragSourceIndex
      ) {
        newIndex = oldIndex + 1;
      }
      newSelected.add(newIndex);
    }
    this.selectedIndices = newSelected;

    await this.renderAllPages();
    this.dragSourceIndex = null;
  }

  private handleDragEnd(): void {
    this.pagesContainer.querySelectorAll('.editor-page').forEach((el) => {
      el.classList.remove('dragging', 'drag-over');
    });
    this.dragSourceIndex = null;
  }

  private updatePageCount(): void {
    const countEl = document.getElementById('editor-page-count');
    if (countEl) {
      const active = this.pages.filter((p) => !p.markedForDeletion).length;
      countEl.textContent = `${this.pages.length} pages (${active} active)`;
    }
  }

  private updateToolbarState(): void {
    const count = this.selectedIndices.size;
    const selectionInfo = document.getElementById('selection-info');
    if (selectionInfo) {
      selectionInfo.textContent = count > 0 ? `${count} selected` : '';
    }
  }
}

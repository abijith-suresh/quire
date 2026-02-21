import type {
  PageState,
  IPDFService,
  IPDFOperationsService,
  PDFLoadedEvent,
} from "../types/interfaces";
import { PDFPasswordRequiredError } from "../types/interfaces";
import { downloadPDF } from "../utils/download";
import { promptForPassword } from "../utils/password-prompt";

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
  private thumbnailObserver: IntersectionObserver | null = null;
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
      throw new Error("Required DOM elements not found for editor");
    }

    // Clear singleton service state from any previous session up-front, before
    // any PDF loading begins. Doing this here (not in handlePDFLoaded) ensures
    // the password stored by loadPDFWithPassword is never wiped mid-session.
    this.pdfService.clearPasswordRegistry();
    this.operationsService.clearCache();

    this.attachEventListeners();
  }

  private attachEventListeners(): void {
    document.addEventListener(
      "pdf-loaded",
      (event) => {
        const customEvent = event as CustomEvent<PDFLoadedEvent>;
        this.handlePDFLoaded(customEvent.detail);
      },
      { signal: this.signal }
    );

    this.addPdfInput.addEventListener("change", (e) => this.handleAddPDF(e));

    document.getElementById("btn-add-pdf")?.addEventListener("click", () => {
      this.addPdfInput.click();
    });
    document.getElementById("btn-rotate")?.addEventListener("click", () => {
      this.rotateSelected();
    });
    document.getElementById("btn-delete")?.addEventListener("click", () => {
      this.toggleDeleteSelected();
    });
    document.getElementById("btn-extract")?.addEventListener("click", () => {
      this.extractSelected();
    });
    document.getElementById("btn-download")?.addEventListener("click", () => {
      this.downloadResult();
    });
    document.getElementById("btn-select-all")?.addEventListener("click", () => {
      this.toggleSelectAll();
    });
  }

  private handlePDFLoaded(detail: PDFLoadedEvent): void {
    const { pageCount, file } = detail;

    this.pages = [];
    this.selectedIndices.clear();

    for (let i = 1; i <= pageCount; i++) {
      this.pages.push({
        id: `${file.name}-${i}-${Date.now()}`,
        sourceFile: file,
        sourcePageNumber: i,
        rotation: 0,
        markedForDeletion: false,
      });
    }

    this.uploaderSection.style.display = "none";
    this.editorSection.style.display = "block";

    this.renderAllPages();
  }

  private async handleAddPDF(event: Event): Promise<void> {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    if (!file || file.type !== "application/pdf") return;

    let loaded = false;
    try {
      await this.pdfService.loadPDF(file);
      loaded = true;
    } catch (error) {
      if (error instanceof PDFPasswordRequiredError) {
        loaded = await this.handleEncryptedAdd(file, error.reason === "wrong-password");
      } else {
        console.error("Failed to add PDF:", error);
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
      this.renderPagesFrom(startIndex);
      this.updatePageCount();
    }

    target.value = "";
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
      console.error("Failed to load encrypted PDF:", error);
      return false;
    }
  }

  // Disconnect any previous observer, clear the grid, create all placeholders
  // synchronously (fast — no PDF work), then hand them to the new observer.
  // Canvas renders fire one-by-one as pages scroll into view.
  private renderAllPages(): void {
    this.thumbnailObserver?.disconnect();

    // Release GPU backing store for any existing canvases before removing them
    // from the DOM — prevents texture memory from lingering after a session reset.
    for (const canvas of this.pagesContainer.querySelectorAll("canvas")) {
      (canvas as HTMLCanvasElement).width = 0;
    }
    this.pagesContainer.innerHTML = "";
    this.setupThumbnailObserver();

    for (let i = 0; i < this.pages.length; i++) {
      const wrapper = this.createPagePlaceholder(i);
      this.pagesContainer.appendChild(wrapper);
      this.thumbnailObserver!.observe(wrapper);
    }

    this.updatePageCount();
  }

  // Appends placeholders for pages added via "Add PDF" and starts observing them.
  private renderPagesFrom(startIndex: number): void {
    for (let i = startIndex; i < this.pages.length; i++) {
      const wrapper = this.createPagePlaceholder(i);
      this.pagesContainer.appendChild(wrapper);
      this.thumbnailObserver?.observe(wrapper);
    }
  }

  // Creates an IntersectionObserver that triggers canvas rendering when a
  // placeholder enters the scrollable viewport (with a 200 px look-ahead margin).
  private setupThumbnailObserver(): void {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const wrapper = entry.target as HTMLDivElement;
          observer.unobserve(wrapper);
          const index = parseInt(wrapper.dataset.index ?? "0", 10);
          const page = this.pages[index];
          if (page) {
            this.renderPageCanvas(wrapper, page);
          }
        }
      },
      {
        root: this.pagesContainer.parentElement,
        rootMargin: "200px",
        threshold: 0,
      }
    );
    this.thumbnailObserver = observer;
  }

  // Builds the full wrapper DOM for one page — everything except the canvas paint.
  // Returns the wrapper ready to be appended and observed.
  private createPagePlaceholder(index: number): HTMLDivElement {
    const page = this.pages[index];

    const wrapper = document.createElement("div");
    wrapper.className = "editor-page";
    wrapper.dataset.index = String(index);
    wrapper.draggable = true;
    wrapper.setAttribute("tabindex", "0");
    wrapper.setAttribute("role", "option");
    wrapper.setAttribute("aria-selected", String(this.selectedIndices.has(index)));
    wrapper.setAttribute(
      "aria-label",
      page.markedForDeletion ? `Page ${index + 1}, marked for deletion` : `Page ${index + 1}`
    );
    if (page.markedForDeletion) wrapper.classList.add("marked-deleted");
    if (this.selectedIndices.has(index)) wrapper.classList.add("selected");

    const canvasContainer = document.createElement("div");
    canvasContainer.className = "canvas-container thumbnail-placeholder";
    canvasContainer.style.transform = `rotate(${page.rotation}deg)`;
    wrapper.appendChild(canvasContainer);

    const controls = document.createElement("div");
    controls.className = "page-controls";

    const label = document.createElement("span");
    label.className = "page-label";
    label.textContent = `Page ${index + 1}`;

    const rotateBtn = document.createElement("button");
    rotateBtn.className = "btn-page-rotate";
    rotateBtn.textContent = "\u21BB";
    rotateBtn.title = "Rotate 90\u00B0";
    rotateBtn.setAttribute("aria-label", "Rotate page 90 degrees");
    rotateBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      this.rotatePage(this.getCurrentIndex(wrapper));
    });

    controls.appendChild(label);
    controls.appendChild(rotateBtn);
    wrapper.appendChild(controls);

    wrapper.addEventListener("click", () => this.toggleSelection(this.getCurrentIndex(wrapper)));

    wrapper.addEventListener("dragstart", (e) =>
      this.handleDragStart(e, this.getCurrentIndex(wrapper))
    );
    wrapper.addEventListener("dragover", (e) => this.handleDragOver(e));
    wrapper.addEventListener("dragenter", (e) => this.handleDragEnter(e, wrapper));
    wrapper.addEventListener("dragleave", () =>
      wrapper.classList.remove("drag-insert-before", "drag-insert-after")
    );
    wrapper.addEventListener("drop", (e) => this.handleDrop(e, this.getCurrentIndex(wrapper)));
    wrapper.addEventListener("dragend", () => this.handleDragEnd());

    return wrapper;
  }

  // Loads and paints the canvas for a single page. The two `isConnected` guards
  // ensure stale renders (from a session that was replaced) are silently dropped.
  private async renderPageCanvas(wrapper: HTMLDivElement, page: PageState): Promise<void> {
    if (!wrapper.isConnected) return;

    const canvasContainer = wrapper.querySelector(".canvas-container") as HTMLDivElement | null;
    if (!canvasContainer) return;

    const canvas = document.createElement("canvas");
    canvas.className = "page-canvas";

    const label = wrapper.querySelector(".page-label") as HTMLSpanElement | null;

    try {
      const storedPassword = this.pdfService.getPassword(page.sourceFile);
      if (storedPassword !== undefined) {
        await this.pdfService.loadPDFWithPassword(page.sourceFile, storedPassword);
      } else {
        await this.pdfService.loadPDF(page.sourceFile);
      }
      await this.pdfService.renderPage(page.sourcePageNumber, canvas, 0.5);

      if (!wrapper.isConnected) return;

      canvasContainer.appendChild(canvas);
      canvasContainer.classList.remove("thumbnail-placeholder");
    } catch (error) {
      console.error(`Failed to render page ${page.sourcePageNumber}:`, error);
      if (label) label.textContent = `${label.textContent} (Error)`;
      canvasContainer.classList.remove("thumbnail-placeholder");
    }
  }

  private rotatePage(index: number): void {
    const page = this.pages[index];
    page.rotation = (page.rotation + 90) % 360;

    const wrapper = this.pagesContainer.children[index] as HTMLDivElement;
    const canvasContainer = wrapper.querySelector(".canvas-container") as HTMLDivElement;
    if (canvasContainer) {
      canvasContainer.style.transform = `rotate(${page.rotation}deg)`;
    }
  }

  private getCurrentIndex(wrapper: HTMLDivElement): number {
    return Array.from(this.pagesContainer.children).indexOf(wrapper);
  }

  private reindexDOM(): void {
    const children = this.pagesContainer.children;
    for (let i = 0; i < children.length; i++) {
      const wrapper = children[i] as HTMLDivElement;
      wrapper.dataset.index = String(i);
      const label = wrapper.querySelector(".page-label") as HTMLSpanElement | null;
      if (label) label.textContent = `Page ${i + 1}`;
      wrapper.classList.toggle("selected", this.selectedIndices.has(i));
      wrapper.setAttribute("aria-selected", String(this.selectedIndices.has(i)));
      const isDeleted = wrapper.classList.contains("marked-deleted");
      wrapper.setAttribute(
        "aria-label",
        isDeleted ? `Page ${i + 1}, marked for deletion` : `Page ${i + 1}`
      );
    }
  }

  private toggleSelection(index: number): void {
    const wrapper = this.pagesContainer.children[index] as HTMLDivElement;
    if (this.selectedIndices.has(index)) {
      this.selectedIndices.delete(index);
      wrapper.classList.remove("selected");
    } else {
      this.selectedIndices.add(index);
      wrapper.classList.add("selected");
    }
    wrapper.setAttribute("aria-selected", String(this.selectedIndices.has(index)));
    this.updateToolbarState();
  }

  private toggleSelectAll(): void {
    if (this.selectedIndices.size === this.pages.length) {
      this.selectedIndices.clear();
      this.pagesContainer.querySelectorAll(".editor-page").forEach((el) => {
        el.classList.remove("selected");
        (el as HTMLElement).setAttribute("aria-selected", "false");
      });
    } else {
      for (let i = 0; i < this.pages.length; i++) {
        this.selectedIndices.add(i);
      }
      this.pagesContainer.querySelectorAll(".editor-page").forEach((el) => {
        el.classList.add("selected");
        (el as HTMLElement).setAttribute("aria-selected", "true");
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
      wrapper.classList.toggle("marked-deleted", page.markedForDeletion);
      wrapper.setAttribute(
        "aria-label",
        page.markedForDeletion ? `Page ${index + 1}, marked for deletion` : `Page ${index + 1}`
      );
    }
  }

  private async extractSelected(): Promise<void> {
    if (this.selectedIndices.size === 0) return;
    const indices = Array.from(this.selectedIndices).sort((a, b) => a - b);
    try {
      const result = await this.operationsService.buildPDFFromSubset(this.pages, indices);
      downloadPDF(result);
    } catch (error) {
      console.error("Failed to extract pages:", error);
    }
  }

  private async downloadResult(): Promise<void> {
    try {
      const result = await this.operationsService.buildPDF(this.pages);
      downloadPDF(result);
    } catch (error) {
      console.error("Failed to build PDF:", error);
    }
  }

  // Drag and drop reordering
  private handleDragStart(event: DragEvent, index: number): void {
    this.dragSourceIndex = index;
    event.dataTransfer!.effectAllowed = "move";
    const wrapper = this.pagesContainer.children[index] as HTMLDivElement;
    wrapper.classList.add("dragging");
  }

  private handleDragOver(event: DragEvent): void {
    event.preventDefault();
    event.dataTransfer!.dropEffect = "move";
  }

  private handleDragEnter(event: DragEvent, wrapper: HTMLDivElement): void {
    event.preventDefault();
    if (this.dragSourceIndex === null) return;
    const targetIndex = this.getCurrentIndex(wrapper);
    wrapper.classList.remove("drag-insert-before", "drag-insert-after");
    if (this.dragSourceIndex < targetIndex) {
      wrapper.classList.add("drag-insert-after");
    } else if (this.dragSourceIndex > targetIndex) {
      wrapper.classList.add("drag-insert-before");
    }
  }

  private handleDrop(event: DragEvent, targetIndex: number): void {
    event.preventDefault();
    if (this.dragSourceIndex === null || this.dragSourceIndex === targetIndex) return;

    const from = this.dragSourceIndex;
    const to = targetIndex;

    const [movedPage] = this.pages.splice(from, 1);
    this.pages.splice(to, 0, movedPage);

    // Update selection indices after reorder
    const newSelected = new Set<number>();
    for (const oldIndex of this.selectedIndices) {
      let newIndex = oldIndex;
      if (oldIndex === from) {
        newIndex = to;
      } else if (from < to && oldIndex > from && oldIndex <= to) {
        newIndex = oldIndex - 1;
      } else if (from > to && oldIndex >= to && oldIndex < from) {
        newIndex = oldIndex + 1;
      }
      newSelected.add(newIndex);
    }
    this.selectedIndices = newSelected;

    // Move DOM node — no canvas re-render
    const children = this.pagesContainer.children;
    const draggedNode = children[from] as HTMLDivElement;
    const referenceNode = children[to] as HTMLDivElement;

    if (from < to) {
      referenceNode.after(draggedNode);
    } else {
      this.pagesContainer.insertBefore(draggedNode, referenceNode);
    }

    this.reindexDOM();
    this.updatePageCount();
    this.dragSourceIndex = null;
  }

  private handleDragEnd(): void {
    this.pagesContainer.querySelectorAll(".editor-page").forEach((el) => {
      el.classList.remove("dragging", "drag-insert-before", "drag-insert-after");
    });
    this.dragSourceIndex = null;
  }

  private updatePageCount(): void {
    const countEl = document.getElementById("editor-page-count");
    if (countEl) {
      const active = this.pages.filter((p) => !p.markedForDeletion).length;
      countEl.textContent = `${this.pages.length} pages (${active} active)`;
    }
  }

  private updateToolbarState(): void {
    const count = this.selectedIndices.size;
    const selectionInfo = document.getElementById("selection-info");
    if (selectionInfo) {
      selectionInfo.textContent = count > 0 ? `${count} selected` : "";
    }
  }
}

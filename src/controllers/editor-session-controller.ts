import { createSignal } from "solid-js";
import { createStore, produce } from "solid-js/store";
import { ROTATION_STEP } from "../constants";
import type {
  IPDFOperationsService,
  IPDFService,
  PageState,
  PDFOperationResult,
} from "../types/interfaces";
import { PDFPasswordRequiredError } from "../types/interfaces";
import {
  createPageStates,
  remapSelectionAfterMove,
  toggleSelectAll,
  toggleSelection,
} from "./editor-page-state";

export interface DragOverTarget {
  index: number;
  direction: "before" | "after";
}

export type EditorOperation = "idle" | "uploading" | "adding" | "extracting" | "building";

type ToastType = "success" | "error" | "info";

type PasswordPrompt = (fileName: string, isRetry: boolean) => Promise<string | null>;
type DownloadHandler = (result: PDFOperationResult) => void;
type ToastHandler = (message: string, type: ToastType) => void;

interface EditorSessionControllerDeps {
  pdfService: IPDFService;
  pdfOperationsService: IPDFOperationsService;
  promptForPassword: PasswordPrompt;
  downloadPDF: DownloadHandler;
  showToast: ToastHandler;
}

export function createEditorSessionController(deps: EditorSessionControllerDeps) {
  const [phase, setPhase] = createSignal<"upload" | "edit">("upload");
  const [pages, setPages] = createStore<PageState[]>([]);
  const [selectedIndices, setSelectedIndices] = createSignal<Set<number>>(new Set<number>());
  const [dragSourceIndex, setDragSourceIndex] = createSignal<number | null>(null);
  const [dragOverTarget, setDragOverTarget] = createSignal<DragOverTarget | null>(null);
  const [operation, setOperation] = createSignal<EditorOperation>("idle");
  const [statusMessage, setStatusMessage] = createSignal("Drop a PDF to begin");

  const activePageCount = () => pages.filter((page) => !page.markedForDeletion).length;
  const isBusy = () => operation() !== "idle";

  function resetSession() {
    deps.pdfService.reset();
    deps.pdfOperationsService.clearCache();
    setPhase("upload");
    setPages([]);
    setSelectedIndices(new Set<number>());
    setDragSourceIndex(null);
    setDragOverTarget(null);
    setOperation("idle");
    setStatusMessage("Drop a PDF to begin");
  }

  function disposeSession() {
    deps.pdfService.reset();
    deps.pdfOperationsService.clearCache();
  }

  function setReadyStatus() {
    setOperation("idle");
    setStatusMessage(phase() === "edit" ? "Ready" : "Drop a PDF to begin");
  }

  function formatPageCount(pageCount: number) {
    return `${pageCount} page${pageCount === 1 ? "" : "s"}`;
  }

  function getLoadErrorMessage(file: File, error: unknown) {
    if (error instanceof Error && error.message) {
      return `Failed to load ${file.name}: ${error.message}`;
    }

    return `Failed to load ${file.name}.`;
  }

  async function unlockPdf(file: File, isRetry: boolean): Promise<number | null> {
    const password = await deps.promptForPassword(file.name, isRetry);
    if (password === null) {
      setReadyStatus();
      return null;
    }

    setStatusMessage("Unlocking PDF...");

    try {
      await deps.pdfService.loadPDFWithPassword(file, password);
      return deps.pdfService.getPageCount();
    } catch (error) {
      if (error instanceof PDFPasswordRequiredError) {
        return unlockPdf(file, true);
      }

      deps.showToast(getLoadErrorMessage(file, error), "error");
      setReadyStatus();
      return null;
    }
  }

  async function loadPdfFile(file: File, mode: "upload" | "add"): Promise<number | null> {
    if (file.type !== "application/pdf") {
      deps.showToast("Please upload a valid PDF file.", "error");
      return null;
    }

    setOperation(mode === "upload" ? "uploading" : "adding");
    setStatusMessage(mode === "upload" ? "Loading PDF..." : "Adding PDF...");

    try {
      await deps.pdfService.loadPDF(file);
      return deps.pdfService.getPageCount();
    } catch (error) {
      if (error instanceof PDFPasswordRequiredError) {
        return unlockPdf(file, error.reason === "wrong-password");
      }

      deps.showToast(getLoadErrorMessage(file, error), "error");
      setReadyStatus();
      return null;
    }
  }

  function createSessionPages(file: File, pageCount: number): PageState[] {
    return createPageStates(file, pageCount);
  }

  function handleFileLoaded(file: File, pageCount: number) {
    setPages(createSessionPages(file, pageCount));
    setSelectedIndices(new Set<number>());
    setPhase("edit");
    setReadyStatus();
    deps.showToast(`${file.name} loaded with ${formatPageCount(pageCount)}.`, "success");
  }

  async function handleInitialUpload(file: File): Promise<void> {
    if (isBusy()) {
      return;
    }

    const pageCount = await loadPdfFile(file, "upload");
    if (pageCount === null) {
      return;
    }

    handleFileLoaded(file, pageCount);
  }

  async function handleAddPdf(file: File): Promise<void> {
    if (isBusy()) {
      return;
    }

    const pageCount = await loadPdfFile(file, "add");
    if (pageCount === null) {
      return;
    }

    setPages(
      produce((draftPages) => {
        draftPages.push(...createSessionPages(file, pageCount));
      })
    );

    setReadyStatus();
    deps.showToast(`Added ${formatPageCount(pageCount)} from ${file.name}.`, "success");
  }

  function handlePageClick(index: number) {
    if (isBusy()) {
      return;
    }

    setSelectedIndices((currentSelection) => toggleSelection(currentSelection, index));
  }

  function handleSelectAll() {
    if (isBusy()) {
      return;
    }

    setSelectedIndices((currentSelection) => toggleSelectAll(pages.length, currentSelection));
  }

  function handlePageRotate(index: number, event: MouseEvent) {
    event.stopPropagation();
    if (isBusy()) {
      return;
    }

    setPages(index, "rotation", (rotation) => (rotation + ROTATION_STEP) % 360);
    setStatusMessage(`Rotated page ${index + 1}.`);
  }

  function handleRotateSelected() {
    if (isBusy() || selectedIndices().size === 0) {
      return;
    }

    for (const index of selectedIndices()) {
      setPages(index, "rotation", (rotation) => (rotation + ROTATION_STEP) % 360);
    }

    setStatusMessage(
      `Rotated ${selectedIndices().size} selected page${selectedIndices().size === 1 ? "" : "s"}.`
    );
  }

  function handleDeleteSelected() {
    if (isBusy() || selectedIndices().size === 0) {
      return;
    }

    for (const index of selectedIndices()) {
      setPages(index, "markedForDeletion", (value) => !value);
    }

    setStatusMessage(
      `Updated deletion state for ${selectedIndices().size} selected page${selectedIndices().size === 1 ? "" : "s"}.`
    );
  }

  async function handleExtract() {
    if (isBusy()) {
      return;
    }

    const indices = Array.from(selectedIndices()).sort((left, right) => left - right);
    if (indices.length === 0) {
      return;
    }

    setOperation("extracting");
    setStatusMessage(`Extracting pages... 0/${indices.length}`);

    try {
      const result = await deps.pdfOperationsService.buildPDFFromSubset(
        pages,
        indices,
        ({ completed, total }) => {
          setStatusMessage(`Extracting pages... ${completed}/${total}`);
        }
      );

      deps.downloadPDF(result);
      deps.showToast("Extracted PDF download started.", "success");
    } catch {
      deps.showToast("Failed to extract selected pages.", "error");
    } finally {
      setReadyStatus();
    }
  }

  async function handleDownload() {
    if (isBusy()) {
      return;
    }

    const totalPages = activePageCount();
    setOperation("building");
    setStatusMessage(`Building PDF... 0/${totalPages}`);

    try {
      const result = await deps.pdfOperationsService.buildPDF(pages, ({ completed, total }) => {
        setStatusMessage(`Building PDF... ${completed}/${total}`);
      });

      deps.downloadPDF(result);
      deps.showToast("Download started.", "success");
    } catch {
      deps.showToast("Failed to build the PDF.", "error");
    } finally {
      setReadyStatus();
    }
  }

  function handleDragStart(index: number, event: DragEvent) {
    if (isBusy()) {
      return;
    }

    setDragSourceIndex(index);
    event.dataTransfer?.setData("text/plain", String(index));
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = "move";
    }
  }

  function handleDragOver(event: DragEvent) {
    if (isBusy()) {
      return;
    }

    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = "move";
    }
  }

  function handleDragEnter(targetIndex: number, event: DragEvent) {
    if (isBusy()) {
      return;
    }

    event.preventDefault();
    const from = dragSourceIndex();
    if (from === null) {
      return;
    }

    if (from < targetIndex) {
      setDragOverTarget({ index: targetIndex, direction: "after" });
    } else if (from > targetIndex) {
      setDragOverTarget({ index: targetIndex, direction: "before" });
    }
  }

  function handleDragLeave() {
    if (isBusy()) {
      return;
    }

    setDragOverTarget(null);
  }

  function handleDrop(targetIndex: number, event: DragEvent) {
    if (isBusy()) {
      return;
    }

    event.preventDefault();
    setDragOverTarget(null);

    const from = dragSourceIndex();
    if (from === null || from === targetIndex) {
      setDragSourceIndex(null);
      return;
    }

    setPages(
      produce((draftPages) => {
        const [movedPage] = draftPages.splice(from, 1);
        draftPages.splice(targetIndex, 0, movedPage);
      })
    );

    setSelectedIndices((currentSelection) =>
      remapSelectionAfterMove(currentSelection, from, targetIndex)
    );
    setDragSourceIndex(null);
  }

  function handleDragEnd() {
    setDragSourceIndex(null);
    setDragOverTarget(null);
  }

  return {
    phase,
    pages,
    selectedIndices,
    dragSourceIndex,
    dragOverTarget,
    operation,
    statusMessage,
    activePageCount,
    isBusy,
    resetSession,
    disposeSession,
    handleInitialUpload,
    handleAddPdf,
    handlePageClick,
    handleSelectAll,
    handlePageRotate,
    handleRotateSelected,
    handleDeleteSelected,
    handleExtract,
    handleDownload,
    handleDragStart,
    handleDragOver,
    handleDragEnter,
    handleDragLeave,
    handleDrop,
    handleDragEnd,
  };
}

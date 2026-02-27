import { createSignal, Show } from "solid-js";
import { createStore, produce } from "solid-js/store";
import { ROTATION_STEP } from "../../constants";
import type { PageState } from "../../types/interfaces";
import { PDFPasswordRequiredError } from "../../types/interfaces";
import { pdfService } from "../../services/pdf-service";
import { pdfOperationsService } from "../../services/pdf-operations-service";
import { downloadPDF } from "../../utils/download";
import { promptForPassword } from "../../utils/password-prompt";
import EditorUploader from "./EditorUploader";
import EditorSidebar from "./EditorSidebar";
import EditorPageGrid from "./EditorPageGrid";

interface DragOverTarget {
  index: number;
  direction: "before" | "after";
}

export default function Editor() {
  const base = import.meta.env.BASE_URL;

  const [phase, setPhase] = createSignal<"upload" | "edit">("upload");
  const [pages, setPages] = createStore<PageState[]>([]);
  const [selectedIndices, setSelectedIndices] = createSignal<Set<number>>(new Set<number>());
  const [dragSourceIndex, setDragSourceIndex] = createSignal<number | null>(null);
  const [dragOverTarget, setDragOverTarget] = createSignal<DragOverTarget | null>(null);

  pdfService.clearPasswordRegistry();
  pdfOperationsService.clearCache();

  const activePageCount = () => pages.filter((p) => !p.markedForDeletion).length;

  // --- File loading ---

  function handleFileLoaded(file: File, pageCount: number): void {
    setPages(
      Array.from({ length: pageCount }, (_, i) => ({
        id: `${file.name}-${i + 1}-${Date.now()}`,
        sourceFile: file,
        sourcePageNumber: i + 1,
        rotation: 0,
        markedForDeletion: false,
      }))
    );
    setSelectedIndices(new Set<number>());
    setPhase("edit");
  }

  async function handleEncryptedAdd(file: File, isRetry: boolean): Promise<boolean> {
    const password = await promptForPassword(file.name, isRetry);
    if (password === null) return false;

    try {
      await pdfService.loadPDFWithPassword(file, password);
      return true;
    } catch (err) {
      if (err instanceof PDFPasswordRequiredError) {
        return handleEncryptedAdd(file, true);
      }
      console.error("Failed to load encrypted PDF:", err);
      return false;
    }
  }

  async function handleAddPdf(file: File): Promise<void> {
    let loaded = false;

    try {
      await pdfService.loadPDF(file);
      loaded = true;
    } catch (err) {
      if (err instanceof PDFPasswordRequiredError) {
        loaded = await handleEncryptedAdd(file, err.reason === "wrong-password");
      } else {
        console.error("Failed to add PDF:", err);
      }
    }

    if (!loaded) return;

    const pageCount = pdfService.getPageCount();
    setPages(
      produce((p) => {
        for (let i = 1; i <= pageCount; i++) {
          p.push({
            id: `${file.name}-${i}-${Date.now()}`,
            sourceFile: file,
            sourcePageNumber: i,
            rotation: 0,
            markedForDeletion: false,
          });
        }
      })
    );
  }

  // --- Selection ---

  function handlePageClick(index: number): void {
    setSelectedIndices((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  }

  function handleSelectAll(): void {
    if (selectedIndices().size === pages.length) {
      setSelectedIndices(new Set<number>());
    } else {
      setSelectedIndices(new Set(pages.map((_, i) => i)));
    }
  }

  // --- Rotation ---

  function handlePageRotate(index: number, e: MouseEvent): void {
    e.stopPropagation();
    setPages(index, "rotation", (r) => (r + ROTATION_STEP) % 360);
  }

  function handleRotateSelected(): void {
    for (const index of selectedIndices()) {
      setPages(index, "rotation", (r) => (r + ROTATION_STEP) % 360);
    }
  }

  // --- Delete ---

  function handleDeleteSelected(): void {
    for (const index of selectedIndices()) {
      setPages(index, "markedForDeletion", (v) => !v);
    }
  }

  // --- Extract / Download ---

  async function handleExtract(): Promise<void> {
    const indices = Array.from(selectedIndices()).sort((a, b) => a - b);
    if (indices.length === 0) return;
    try {
      const result = await pdfOperationsService.buildPDFFromSubset(pages, indices);
      downloadPDF(result);
    } catch (err) {
      console.error("Failed to extract pages:", err);
    }
  }

  async function handleDownload(): Promise<void> {
    try {
      const result = await pdfOperationsService.buildPDF(pages);
      downloadPDF(result);
    } catch (err) {
      console.error("Failed to build PDF:", err);
    }
  }

  // --- Drag and drop ---

  function handleDragStart(index: number, e: DragEvent): void {
    setDragSourceIndex(index);
    e.dataTransfer!.effectAllowed = "move";
  }

  function handleDragOver(e: DragEvent): void {
    e.preventDefault();
    e.dataTransfer!.dropEffect = "move";
  }

  function handleDragEnter(targetIndex: number, e: DragEvent): void {
    e.preventDefault();
    const from = dragSourceIndex();
    if (from === null) return;
    if (from < targetIndex) {
      setDragOverTarget({ index: targetIndex, direction: "after" });
    } else if (from > targetIndex) {
      setDragOverTarget({ index: targetIndex, direction: "before" });
    }
  }

  function handleDragLeave(): void {
    setDragOverTarget(null);
  }

  function handleDrop(targetIndex: number, e: DragEvent): void {
    e.preventDefault();
    setDragOverTarget(null);

    const from = dragSourceIndex();
    if (from === null || from === targetIndex) {
      setDragSourceIndex(null);
      return;
    }
    const to = targetIndex;

    setPages(
      produce((p) => {
        const [moved] = p.splice(from, 1);
        p.splice(to, 0, moved);
      })
    );

    // Remap selection indices after reorder
    setSelectedIndices((prev) => {
      const next = new Set<number>();
      for (const oldIndex of prev) {
        let newIndex = oldIndex;
        if (oldIndex === from) {
          newIndex = to;
        } else if (from < to && oldIndex > from && oldIndex <= to) {
          newIndex = oldIndex - 1;
        } else if (from > to && oldIndex >= to && oldIndex < from) {
          newIndex = oldIndex + 1;
        }
        next.add(newIndex);
      }
      return next;
    });

    setDragSourceIndex(null);
  }

  function handleDragEnd(): void {
    setDragSourceIndex(null);
    setDragOverTarget(null);
  }

  return (
    <div class="font-['Work_Sans',sans-serif] bg-white text-[#111] h-dvh flex flex-col overflow-hidden">
      {/* Dark header */}
      <header class="bg-[#111] text-white h-14 flex items-center px-6 flex-shrink-0">
        <a
          href={base}
          class="font-['Bebas_Neue',sans-serif] text-2xl tracking-wide text-white no-underline"
        >
          Pasta
        </a>
        <span class="w-px h-6 bg-[#555] mx-5" />
        <Show when={phase() === "edit"}>
          <span class="text-sm text-[#888]">
            {pages.length} pages ({activePageCount()} active)
          </span>
        </Show>
        <span class="flex-1" />
        <Show when={phase() === "edit" && selectedIndices().size > 0}>
          <span class="text-sm text-[#888]">{selectedIndices().size} selected</span>
          <span class="w-px h-6 bg-[#555] mx-5" />
        </Show>
        <a href={base} class="text-sm text-[#888] hover:text-white no-underline transition-colors">
          &#8592; Back
        </a>
      </header>

      {/* Content — upload or edit */}
      <Show when={phase() === "edit"} fallback={<EditorUploader onFileLoaded={handleFileLoaded} />}>
        <div class="flex h-[calc(100dvh-3.5rem)] min-h-0">
          <EditorSidebar
            selectedCount={selectedIndices().size}
            onSelectAll={handleSelectAll}
            onRotate={handleRotateSelected}
            onDelete={handleDeleteSelected}
            onExtract={handleExtract}
            onDownload={handleDownload}
            onAddPdf={handleAddPdf}
          />

          <main class="flex-1 flex flex-col min-h-0">
            {/* Dense page grid — only this scrolls */}
            <EditorPageGrid
              pages={pages}
              selectedIndices={selectedIndices()}
              dragSourceIndex={dragSourceIndex()}
              dragOverTarget={dragOverTarget()}
              onPageClick={handlePageClick}
              onPageRotate={handlePageRotate}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onDragEnd={handleDragEnd}
            />

            {/* Mobile toolbar */}
            <div class="md:hidden border-t border-[#ddd] p-2.5 flex items-center gap-2 flex-wrap justify-center">
              <button
                onClick={handleSelectAll}
                class="text-[11px] uppercase tracking-wider text-[#555] bg-transparent border border-[#ddd] px-3 py-1.5 cursor-pointer"
              >
                Select All
              </button>
              <button
                onClick={handleRotateSelected}
                class="text-[11px] uppercase tracking-wider text-[#555] bg-transparent border border-[#ddd] px-3 py-1.5 cursor-pointer"
              >
                Rotate
              </button>
              <button
                onClick={handleDeleteSelected}
                class="text-[11px] uppercase tracking-wider text-[#ff0000] bg-transparent border border-[#ddd] px-3 py-1.5 cursor-pointer"
              >
                Delete
              </button>
              <button
                onClick={() => {
                  const input = document.createElement("input");
                  input.type = "file";
                  input.accept = "application/pdf";
                  input.onchange = () => {
                    const file = input.files?.[0];
                    if (file) handleAddPdf(file);
                  };
                  input.click();
                }}
                class="text-[11px] uppercase tracking-wider text-[#555] bg-transparent border border-[#ddd] px-3 py-1.5 cursor-pointer"
              >
                Add PDF
              </button>
              <button
                onClick={handleExtract}
                class="text-[11px] uppercase tracking-wider text-[#555] bg-transparent border border-[#ddd] px-3 py-1.5 cursor-pointer"
              >
                Extract
              </button>
              <button
                onClick={handleDownload}
                class="text-[11px] uppercase tracking-wider bg-[#ff0000] text-white border-none px-4 py-1.5 cursor-pointer"
              >
                Download
              </button>
            </div>

            {/* Status bar */}
            <div
              role="status"
              aria-live="polite"
              aria-atomic="true"
              class="h-8 bg-[#f5f5f5] border-t border-[#ddd] flex items-center px-5 text-[11px] text-[#888] flex-shrink-0"
            >
              <span>
                {pages.length} pages ({activePageCount()} active)
              </span>
              <span class="flex-1 text-center">
                {selectedIndices().size > 0 ? `${selectedIndices().size} selected` : ""}
              </span>
              <span class="flex items-center gap-1.5">
                <span class="w-1.5 h-1.5 bg-[#ff0000] inline-block" />
                Ready
              </span>
            </div>
          </main>
        </div>
      </Show>
    </div>
  );
}

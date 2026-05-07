import { createSignal, For, onCleanup, onMount, Show } from "solid-js";
import { createEditorSessionController } from "../../controllers/editor-session-controller";
import { pdfOperationsService } from "../../services/pdf-operations-service";
import { pdfService } from "../../services/pdf-service";
import { downloadPDF } from "../../utils/download";
import { promptForPassword } from "../../utils/password-prompt";
import {
  getToastDismissTimeout,
  TOAST_EVENT_NAME,
  type ToastDetail,
  showToast,
} from "../../utils/toast";
import EditorPageGrid from "./EditorPageGrid";
import EditorSidebar from "./EditorSidebar";
import EditorUploader from "./EditorUploader";

type ToastTone = "success" | "error" | "info";

interface Toast {
  id: number;
  message: string;
  tone: ToastTone;
}

export default function Editor() {
  const base = import.meta.env.BASE_URL;
  const controller = createEditorSessionController({
    pdfService,
    pdfOperationsService,
    promptForPassword,
    downloadPDF,
    showToast,
  });

  let nextToastId = 0;
  const toastTimers = new Map<number, number>();
  const [toasts, setToasts] = createSignal<Toast[]>([]);

  onMount(() => {
    controller.resetSession();
  });

  function dismissToast(id: number) {
    const timer = toastTimers.get(id);
    if (timer) {
      window.clearTimeout(timer);
      toastTimers.delete(id);
    }

    setToasts((current) => current.filter((toast) => toast.id !== id));
  }

  function addToast(message: string, tone: ToastTone) {
    const id = ++nextToastId;
    const timer = window.setTimeout(() => dismissToast(id), getToastDismissTimeout());
    toastTimers.set(id, timer);
    setToasts((current) => [...current, { id, message, tone }]);
  }

  const handleToast = (event: Event) => {
    const customEvent = event as CustomEvent<ToastDetail>;
    addToast(customEvent.detail.message, customEvent.detail.type);
  };

  if (typeof document !== "undefined") {
    document.addEventListener(TOAST_EVENT_NAME, handleToast);
  }

  onCleanup(() => {
    if (typeof document !== "undefined") {
      document.removeEventListener(TOAST_EVENT_NAME, handleToast);
    }

    for (const timer of toastTimers.values()) {
      window.clearTimeout(timer);
    }

    toastTimers.clear();
    controller.disposeSession();
  });

  return (
    <div class="font-['Work_Sans',sans-serif] bg-white text-[#111] h-dvh flex flex-col overflow-hidden">
      <div
        data-testid="editor-toast-region"
        role="status"
        aria-live="polite"
        aria-atomic="true"
        class="pointer-events-none fixed right-4 top-4 z-50 flex max-w-sm flex-col gap-2"
      >
        <For each={toasts()}>
          {(toast) => (
            <div
              data-testid="editor-toast"
              class={`rounded-sm border px-4 py-3 text-sm shadow-sm ${
                toast.tone === "error"
                  ? "border-[#ffb3b3] bg-[#fff5f5] text-[#8a1111]"
                  : toast.tone === "success"
                    ? "border-[#d7e7d7] bg-[#f5fbf5] text-[#1f5f1f]"
                    : "border-[#ddd] bg-white text-[#555]"
              }`}
            >
              {toast.message}
            </div>
          )}
        </For>
      </div>

      <div
        data-testid="editor-root"
        data-operation={controller.operation()}
        aria-busy={controller.isBusy()}
        class="contents"
      >
        <header class="bg-[#111] text-white h-14 flex items-center px-6 flex-shrink-0">
          <a
            href={base}
            class="font-['Bebas_Neue',sans-serif] text-2xl tracking-wide text-white no-underline"
          >
            Pasta
          </a>
          <span class="w-px h-6 bg-[#555] mx-5" />
          <Show when={controller.phase() === "edit"}>
            <span class="text-sm text-[#888]">
              {controller.pages.length} pages ({controller.activePageCount()} active)
            </span>
          </Show>
          <span class="flex-1" />
          <Show when={controller.phase() === "edit" && controller.selectedIndices().size > 0}>
            <span class="text-sm text-[#888]">{controller.selectedIndices().size} selected</span>
            <span class="w-px h-6 bg-[#555] mx-5" />
          </Show>
          <a
            href={base}
            class="text-sm text-[#888] hover:text-white no-underline transition-colors"
          >
            &#8592; Back
          </a>
        </header>

        <Show
          when={controller.phase() === "edit"}
          fallback={
            <EditorUploader
              busy={controller.isBusy()}
              statusMessage={controller.statusMessage()}
              onFileSelected={controller.handleInitialUpload}
            />
          }
        >
          <div class="flex h-[calc(100dvh-3.5rem)] min-h-0">
            <EditorSidebar
              busy={controller.isBusy()}
              selectedCount={controller.selectedIndices().size}
              onSelectAll={controller.handleSelectAll}
              onRotate={controller.handleRotateSelected}
              onDelete={controller.handleDeleteSelected}
              onExtract={controller.handleExtract}
              onDownload={controller.handleDownload}
              onAddPdf={controller.handleAddPdf}
            />

            <main class="flex-1 flex flex-col min-h-0">
              <EditorPageGrid
                busy={controller.isBusy()}
                pages={controller.pages}
                selectedIndices={controller.selectedIndices()}
                dragSourceIndex={controller.dragSourceIndex()}
                dragOverTarget={controller.dragOverTarget()}
                onPageClick={controller.handlePageClick}
                onPageRotate={controller.handlePageRotate}
                onDragStart={controller.handleDragStart}
                onDragOver={controller.handleDragOver}
                onDragEnter={controller.handleDragEnter}
                onDragLeave={controller.handleDragLeave}
                onDrop={controller.handleDrop}
                onDragEnd={controller.handleDragEnd}
              />

              <div class="md:hidden border-t border-[#ddd] p-2.5 flex items-center gap-2 flex-wrap justify-center">
                <button
                  data-testid="editor-select-all-button-mobile"
                  disabled={controller.isBusy()}
                  onClick={controller.handleSelectAll}
                  class="text-[11px] uppercase tracking-wider text-[#555] bg-transparent border border-[#ddd] px-3 py-1.5 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Select All
                </button>
                <button
                  data-testid="editor-rotate-button-mobile"
                  disabled={controller.isBusy()}
                  onClick={controller.handleRotateSelected}
                  class="text-[11px] uppercase tracking-wider text-[#555] bg-transparent border border-[#ddd] px-3 py-1.5 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Rotate
                </button>
                <button
                  data-testid="editor-delete-button-mobile"
                  disabled={controller.isBusy()}
                  onClick={controller.handleDeleteSelected}
                  class="text-[11px] uppercase tracking-wider text-[#ff0000] bg-transparent border border-[#ddd] px-3 py-1.5 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Delete
                </button>
                <button
                  data-testid="editor-add-pdf-button-mobile"
                  disabled={controller.isBusy()}
                  onClick={() => {
                    if (controller.isBusy()) return;
                    const input = document.createElement("input");
                    input.type = "file";
                    input.accept = "application/pdf";
                    input.onchange = () => {
                      const file = input.files?.[0];
                      if (file) void controller.handleAddPdf(file);
                    };
                    input.click();
                  }}
                  class="text-[11px] uppercase tracking-wider text-[#555] bg-transparent border border-[#ddd] px-3 py-1.5 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Add PDF
                </button>
                <button
                  data-testid="editor-extract-button-mobile"
                  disabled={controller.isBusy()}
                  onClick={() => void controller.handleExtract()}
                  class="text-[11px] uppercase tracking-wider text-[#555] bg-transparent border border-[#ddd] px-3 py-1.5 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Extract
                </button>
                <button
                  data-testid="editor-download-button-mobile"
                  disabled={controller.isBusy()}
                  onClick={() => void controller.handleDownload()}
                  class="text-[11px] uppercase tracking-wider bg-[#ff0000] text-white border-none px-4 py-1.5 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {controller.isBusy() ? "Working..." : "Download"}
                </button>
              </div>

              <div
                role="status"
                aria-live="polite"
                aria-atomic="true"
                data-testid="editor-status-bar"
                class="h-8 bg-[#f5f5f5] border-t border-[#ddd] flex items-center px-5 text-[11px] text-[#888] flex-shrink-0"
              >
                <span>
                  {controller.pages.length} pages ({controller.activePageCount()} active)
                </span>
                <span class="flex-1 text-center">
                  {controller.selectedIndices().size > 0
                    ? `${controller.selectedIndices().size} selected`
                    : ""}
                </span>
                <span class="flex items-center gap-1.5" data-testid="editor-status-message">
                  <span class="w-1.5 h-1.5 bg-[#ff0000] inline-block" />
                  {controller.statusMessage()}
                </span>
              </div>
            </main>
          </div>
        </Show>
      </div>
    </div>
  );
}

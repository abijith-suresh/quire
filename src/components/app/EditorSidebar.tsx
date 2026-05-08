import { Show } from "solid-js";

interface Props {
  busy: boolean;
  selectedCount: number;
  onSelectAll: () => void;
  onRotate: () => void;
  onDelete: () => void;
  onExtract: () => void;
  onDownload: () => void;
  onAddPdf: (file: File) => void;
}

export default function EditorSidebar(props: Props) {
  // eslint-disable-next-line no-unassigned-vars
  let addPdfInput!: HTMLInputElement;

  return (
    <aside class="w-56 border-r border-[#ddd] flex-col flex-shrink-0 hidden md:flex">
      <div class="flex-1 overflow-y-auto min-h-0">
        {/* Upload */}
        <div class="p-4 border-b border-[#ddd]">
          <p class="text-[11px] uppercase tracking-wider text-[#888] mb-2">Upload</p>
          <button
            data-testid="editor-add-pdf-button"
            onClick={() => addPdfInput.click()}
            disabled={props.busy}
            class="flex w-full items-center justify-center gap-2 border border-dashed border-[#ddd] bg-transparent py-6 text-center transition-colors hover:border-[#111] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Show
              when={props.busy}
              fallback={
                <span class="text-[11px] text-[#888] uppercase tracking-wider">+ Add PDF</span>
              }
            >
              <>
                <span class="h-3 w-3 animate-spin rounded-full border border-[#bbb] border-t-[#111]" />
                <span class="text-[11px] text-[#888] uppercase tracking-wider">Working...</span>
              </>
            </Show>
          </button>
          <input
            ref={addPdfInput}
            data-testid="editor-add-pdf-input"
            type="file"
            accept="application/pdf"
            class="hidden"
            disabled={props.busy}
            onChange={(e) => {
              const file = e.currentTarget.files?.[0];
              if (file) props.onAddPdf(file);
              e.currentTarget.value = "";
            }}
          />
        </div>

        {/* Selection */}
        <div class="p-4 border-b border-[#ddd]">
          <p class="text-[11px] uppercase tracking-wider text-[#888] mb-3">Selection</p>
          <button
            data-testid="editor-select-all-button"
            onClick={props.onSelectAll}
            aria-label="Select all pages"
            disabled={props.busy}
            class="w-full text-left text-xs text-[#555] hover:text-[#111] hover:bg-[#f5f5f5] bg-transparent border-none cursor-pointer py-2 px-2 transition-colors disabled:cursor-not-allowed disabled:opacity-60"
          >
            Select All
          </button>
        </div>

        {/* Actions */}
        <div class="p-4 border-b border-[#ddd]">
          <p class="text-[11px] uppercase tracking-wider text-[#888] mb-3">Actions</p>
          <button
            data-testid="editor-rotate-button"
            onClick={props.onRotate}
            aria-label="Rotate selected pages 90 degrees"
            disabled={props.busy}
            class="w-full text-left text-xs text-[#555] hover:text-[#111] hover:bg-[#f5f5f5] bg-transparent border-none cursor-pointer py-2 px-2 transition-colors disabled:cursor-not-allowed disabled:opacity-60"
          >
            Rotate
          </button>
          <button
            data-testid="editor-delete-button"
            onClick={props.onDelete}
            aria-label="Mark selected pages for deletion"
            disabled={props.busy}
            class="w-full text-left text-xs text-[#ff0000] hover:bg-[#fff5f5] bg-transparent border-none cursor-pointer py-2 px-2 transition-colors disabled:cursor-not-allowed disabled:opacity-60"
          >
            Delete
          </button>
          <button
            data-testid="editor-extract-button"
            onClick={props.onExtract}
            aria-label="Extract selected pages to a new PDF"
            disabled={props.busy}
            class="w-full text-left text-xs text-[#555] hover:text-[#111] hover:bg-[#f5f5f5] bg-transparent border-none cursor-pointer py-2 px-2 transition-colors disabled:cursor-not-allowed disabled:opacity-60"
          >
            Extract
          </button>
        </div>
      </div>

      {/* Export — pinned to bottom */}
      <div class="p-4 border-t border-[#ddd] flex-shrink-0">
        <p class="text-[11px] uppercase tracking-wider text-[#888] mb-3">Export</p>
        <button
          data-testid="editor-download-button"
          onClick={props.onDownload}
          disabled={props.busy}
          class="flex w-full items-center justify-center gap-2 border-none bg-[#ff0000] py-3 text-[11px] font-semibold uppercase tracking-[0.15em] text-white transition-colors hover:bg-[#111] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Show when={props.busy} fallback={<span>Download</span>}>
            <>
              <span class="h-3 w-3 animate-spin rounded-full border border-white/50 border-t-white" />
              <span>Working...</span>
            </>
          </Show>
        </button>
      </div>
    </aside>
  );
}

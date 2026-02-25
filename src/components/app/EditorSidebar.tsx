interface Props {
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
            onClick={() => addPdfInput.click()}
            class="w-full border border-dashed border-[#ddd] hover:border-[#111] transition-colors py-6 text-center cursor-pointer bg-transparent"
          >
            <span class="text-[11px] text-[#888] uppercase tracking-wider">+ Add PDF</span>
          </button>
          <input
            ref={addPdfInput}
            type="file"
            accept="application/pdf"
            class="hidden"
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
            onClick={props.onSelectAll}
            aria-label="Select all pages"
            class="w-full text-left text-xs text-[#555] hover:text-[#111] hover:bg-[#f5f5f5] bg-transparent border-none cursor-pointer py-2 px-2 transition-colors"
          >
            Select All
          </button>
        </div>

        {/* Actions */}
        <div class="p-4 border-b border-[#ddd]">
          <p class="text-[11px] uppercase tracking-wider text-[#888] mb-3">Actions</p>
          <button
            onClick={props.onRotate}
            aria-label="Rotate selected pages 90 degrees"
            class="w-full text-left text-xs text-[#555] hover:text-[#111] hover:bg-[#f5f5f5] bg-transparent border-none cursor-pointer py-2 px-2 transition-colors"
          >
            Rotate
          </button>
          <button
            onClick={props.onDelete}
            aria-label="Mark selected pages for deletion"
            class="w-full text-left text-xs text-[#ff0000] hover:bg-[#fff5f5] bg-transparent border-none cursor-pointer py-2 px-2 transition-colors"
          >
            Delete
          </button>
          <button
            onClick={props.onExtract}
            aria-label="Extract selected pages to a new PDF"
            class="w-full text-left text-xs text-[#555] hover:text-[#111] hover:bg-[#f5f5f5] bg-transparent border-none cursor-pointer py-2 px-2 transition-colors"
          >
            Extract
          </button>
        </div>
      </div>

      {/* Export — pinned to bottom */}
      <div class="p-4 border-t border-[#ddd] flex-shrink-0">
        <p class="text-[11px] uppercase tracking-wider text-[#888] mb-3">Export</p>
        <button
          onClick={props.onDownload}
          class="w-full bg-[#ff0000] text-white text-[11px] uppercase tracking-[0.15em] font-semibold py-3 border-none cursor-pointer hover:bg-[#111] transition-colors"
        >
          Download
        </button>
      </div>
    </aside>
  );
}

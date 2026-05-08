interface Props {
  busy: boolean;
  selectedCount: number;
  metadata: {
    title: string;
    author: string;
    subject: string;
    keywords: string;
  };
  onMetadataChange: (field: "title" | "author" | "subject" | "keywords", value: string) => void;
  onMetadataDownload: () => void;
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
            class="w-full border border-dashed border-[#ddd] hover:border-[#111] transition-colors py-6 text-center cursor-pointer bg-transparent disabled:cursor-not-allowed disabled:opacity-60"
          >
            <span class="text-[11px] text-[#888] uppercase tracking-wider">
              {props.busy ? "Working..." : "+ Add PDF"}
            </span>
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
      <div class="p-4 border-t border-[#ddd] flex-shrink-0 space-y-4">
        <div>
          <p class="text-[11px] uppercase tracking-wider text-[#888] mb-3">Metadata</p>
          <div class="space-y-2">
            <input
              data-testid="editor-metadata-title"
              type="text"
              placeholder="Title"
              value={props.metadata.title}
              disabled={props.busy}
              onInput={(e) => props.onMetadataChange("title", e.currentTarget.value)}
              class="w-full border border-[#ddd] px-2 py-2 text-xs text-[#111] outline-none focus:border-[#111] disabled:cursor-not-allowed disabled:opacity-60"
            />
            <input
              data-testid="editor-metadata-author"
              type="text"
              placeholder="Author"
              value={props.metadata.author}
              disabled={props.busy}
              onInput={(e) => props.onMetadataChange("author", e.currentTarget.value)}
              class="w-full border border-[#ddd] px-2 py-2 text-xs text-[#111] outline-none focus:border-[#111] disabled:cursor-not-allowed disabled:opacity-60"
            />
            <input
              data-testid="editor-metadata-subject"
              type="text"
              placeholder="Subject"
              value={props.metadata.subject}
              disabled={props.busy}
              onInput={(e) => props.onMetadataChange("subject", e.currentTarget.value)}
              class="w-full border border-[#ddd] px-2 py-2 text-xs text-[#111] outline-none focus:border-[#111] disabled:cursor-not-allowed disabled:opacity-60"
            />
            <input
              data-testid="editor-metadata-keywords"
              type="text"
              placeholder="Keywords"
              value={props.metadata.keywords}
              disabled={props.busy}
              onInput={(e) => props.onMetadataChange("keywords", e.currentTarget.value)}
              class="w-full border border-[#ddd] px-2 py-2 text-xs text-[#111] outline-none focus:border-[#111] disabled:cursor-not-allowed disabled:opacity-60"
            />
          </div>
          <button
            data-testid="editor-metadata-button"
            onClick={props.onMetadataDownload}
            disabled={props.busy}
            class="mt-3 w-full border border-[#111] bg-transparent py-3 text-[11px] font-semibold uppercase tracking-[0.15em] text-[#111] transition-colors hover:bg-[#111] hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            Apply Metadata & Download
          </button>
        </div>
        <div>
          <p class="text-[11px] uppercase tracking-wider text-[#888] mb-3">Export</p>
          <button
            data-testid="editor-download-button"
            onClick={props.onDownload}
            disabled={props.busy}
            class="w-full bg-[#ff0000] text-white text-[11px] uppercase tracking-[0.15em] font-semibold py-3 border-none cursor-pointer hover:bg-[#111] transition-colors disabled:cursor-not-allowed disabled:opacity-60"
          >
            {props.busy ? "Working..." : "Download"}
          </button>
        </div>
      </div>
    </aside>
  );
}

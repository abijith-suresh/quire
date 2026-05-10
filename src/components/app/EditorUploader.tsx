import { createSignal } from "solid-js";

interface Props {
  busy: boolean;
  statusMessage: string;
  onFileSelected: (file: File) => void;
  onImagesSelected: (files: File[]) => void;
}

export default function EditorUploader(props: Props) {
  const [isDragOver, setIsDragOver] = createSignal(false);
  // eslint-disable-next-line no-unassigned-vars
  let fileInput!: HTMLInputElement;
  // eslint-disable-next-line no-unassigned-vars
  let imageInput!: HTMLInputElement;

  function pickFile() {
    if (props.busy) return;
    fileInput.click();
  }

  function handleFile(file: File | undefined) {
    if (!file || props.busy) return;
    props.onFileSelected(file);
  }

  return (
    <div class="flex-1 flex items-center justify-center min-h-0">
      <div class="w-full max-w-lg px-6">
        <div
          data-testid="editor-upload-dropzone"
          role="button"
          tabIndex={0}
          aria-busy={props.busy}
          aria-label="Click or drag a PDF file here to upload"
          class={`border-2 border-dashed transition-colors py-20 text-center ${
            props.busy
              ? "border-[#111] bg-[#f5f5f5] cursor-wait"
              : `cursor-pointer ${isDragOver() ? "border-[#111] bg-[#f5f5f5]" : "border-[#ddd] hover:border-[#111]"}`
          }`}
          onClick={pickFile}
          onKeyDown={(e) => {
            if (props.busy) return;
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              pickFile();
            }
          }}
          onDragOver={(e) => {
            if (props.busy) return;
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={(e) => {
            if (props.busy) return;
            e.preventDefault();
            setIsDragOver(false);
            handleFile(e.dataTransfer?.files[0]);
          }}
        >
          <p class="font-['Bebas_Neue',sans-serif] text-4xl text-[#111] mb-2">
            {props.busy ? "Working..." : "Drop PDF here"}
          </p>
          <p class="text-[11px] uppercase tracking-[0.15em] text-[#888]">
            {props.busy ? props.statusMessage : "or click to browse"}
          </p>
        </div>
        <input
          ref={fileInput}
          data-testid="editor-upload-input"
          type="file"
          accept="application/pdf"
          class="hidden"
          disabled={props.busy}
          onChange={(e) => {
            handleFile(e.currentTarget.files?.[0]);
            e.currentTarget.value = "";
          }}
        />
        <div class="mt-4 space-y-3 text-center">
          <button
            type="button"
            data-testid="editor-convert-images-button"
            disabled={props.busy}
            onClick={() => imageInput.click()}
            class="w-full border border-[#ddd] py-3 text-[11px] uppercase tracking-[0.15em] text-[#555] transition-colors hover:border-[#111] disabled:cursor-not-allowed disabled:opacity-60"
          >
            Convert Images to PDF
          </button>
          <input
            ref={imageInput}
            data-testid="editor-convert-images-input"
            type="file"
            accept="image/png,image/jpeg"
            multiple
            class="hidden"
            disabled={props.busy}
            onChange={(e) => {
              const files = Array.from(e.currentTarget.files ?? []);
              if (files.length > 0) props.onImagesSelected(files);
              e.currentTarget.value = "";
            }}
          />
          <p class="text-[11px] uppercase tracking-[0.15em] text-[#888]">
            PDF to images — coming soon
          </p>
        </div>
        <p
          class="text-[#888] text-xs mt-3 text-center min-h-[1em]"
          data-testid="editor-upload-status"
        >
          {props.busy ? props.statusMessage : "Private by default. Files stay in your browser."}
        </p>
      </div>
    </div>
  );
}

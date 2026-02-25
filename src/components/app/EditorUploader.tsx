import { createSignal } from "solid-js";
import { pdfService } from "../../services/pdf-service";
import { PDFPasswordRequiredError } from "../../types/interfaces";
import { promptForPassword } from "../../utils/password-prompt";

interface Props {
  onFileLoaded: (file: File, pageCount: number) => void;
}

export default function EditorUploader(props: Props) {
  const [isDragOver, setIsDragOver] = createSignal(false);
  const [errorMsg, setErrorMsg] = createSignal("");
  let fileInput!: HTMLInputElement;
  let errorTimer: ReturnType<typeof setTimeout> | null = null;

  function showError(message: string) {
    if (errorTimer) clearTimeout(errorTimer);
    setErrorMsg(message);
    errorTimer = setTimeout(() => setErrorMsg(""), 5000);
  }

  async function handleEncryptedFile(file: File, isRetry: boolean): Promise<void> {
    const password = await promptForPassword(file.name, isRetry);
    if (password === null) return;

    try {
      await pdfService.loadPDFWithPassword(file, password);
    } catch (err) {
      if (err instanceof PDFPasswordRequiredError) {
        await handleEncryptedFile(file, true);
        return;
      }
      showError("Failed to load PDF: " + (err instanceof Error ? err.message : String(err)));
      return;
    }

    pdfService.dispatchLoadedEvent();
    props.onFileLoaded(file, pdfService.getPageCount());
  }

  async function processFile(file: File): Promise<void> {
    if (file.type !== "application/pdf") {
      showError("Please upload a valid PDF file");
      return;
    }

    try {
      await pdfService.loadPDF(file);
    } catch (err) {
      if (err instanceof PDFPasswordRequiredError) {
        await handleEncryptedFile(file, err.reason === "wrong-password");
        return;
      }
      showError("Failed to load PDF: " + (err instanceof Error ? err.message : String(err)));
      return;
    }

    pdfService.dispatchLoadedEvent();
    props.onFileLoaded(file, pdfService.getPageCount());
  }

  return (
    <div class="flex-1 flex items-center justify-center min-h-0">
      <div class="w-full max-w-lg px-6">
        <div
          role="button"
          tabindex="0"
          aria-label="Click or drag a PDF file here to upload"
          class={`border-2 border-dashed transition-colors py-20 text-center cursor-pointer ${
            isDragOver() ? "border-[#111] bg-[#f5f5f5]" : "border-[#ddd] hover:border-[#111]"
          }`}
          onClick={() => fileInput.click()}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              fileInput.click();
            }
          }}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragOver(false);
            const file = e.dataTransfer?.files[0];
            if (file) processFile(file);
          }}
        >
          <p class="font-['Bebas_Neue',sans-serif] text-4xl text-[#111] mb-2">Drop PDF here</p>
          <p class="text-[11px] uppercase tracking-[0.15em] text-[#888]">or click to browse</p>
        </div>
        <input
          ref={fileInput}
          type="file"
          accept="application/pdf"
          class="hidden"
          onChange={(e) => {
            const file = e.currentTarget.files?.[0];
            if (file) processFile(file);
            e.currentTarget.value = "";
          }}
        />
        <p role="alert" class="text-[#ff0000] text-xs mt-3 text-center min-h-[1em]">
          {errorMsg()}
        </p>
      </div>
    </div>
  );
}

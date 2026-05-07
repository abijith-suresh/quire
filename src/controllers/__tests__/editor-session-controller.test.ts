import { beforeEach, describe, expect, it, vi } from "vitest";
import { createEditorSessionController } from "../editor-session-controller";
import { PDFPasswordRequiredError, type PDFOperationResult } from "../../types/interfaces";

function createMockPdfService() {
  return {
    loadPDF: vi.fn(),
    loadPDFWithPassword: vi.fn(),
    getPassword: vi.fn().mockReturnValue(undefined),
    clearPasswordRegistry: vi.fn(),
    getPageCount: vi.fn().mockReturnValue(2),
    getFileName: vi.fn().mockReturnValue(""),
    isLoaded: vi.fn().mockReturnValue(false),
    unload: vi.fn(),
    reset: vi.fn(),
    renderPage: vi.fn(),
    getPageInfo: vi.fn(),
  };
}

function createMockOperationsService() {
  return {
    buildPDF: vi.fn(),
    buildPDFFromSubset: vi.fn(),
    clearCache: vi.fn(),
  };
}

describe("editor session controller", () => {
  const sampleFile = new File(["plain"], "sample.pdf", { type: "application/pdf" });
  let pdfService: ReturnType<typeof createMockPdfService>;
  let operationsService: ReturnType<typeof createMockOperationsService>;
  let promptForPassword: ReturnType<typeof vi.fn>;
  let downloadPDF: ReturnType<typeof vi.fn>;
  let showToast: ReturnType<typeof vi.fn>;

  function createController() {
    return createEditorSessionController({
      pdfService,
      pdfOperationsService: operationsService,
      promptForPassword: promptForPassword as (
        fileName: string,
        isRetry: boolean
      ) => Promise<string | null>,
      downloadPDF: downloadPDF as (result: PDFOperationResult) => void,
      showToast: showToast as (message: string, type: "success" | "error" | "info") => void,
    });
  }

  beforeEach(() => {
    pdfService = createMockPdfService();
    operationsService = createMockOperationsService();
    promptForPassword = vi.fn();
    downloadPDF = vi.fn();
    showToast = vi.fn();
  });

  it("loads the initial upload into an edit session", async () => {
    const controller = createController();

    await controller.handleInitialUpload(sampleFile);

    expect(pdfService.loadPDF).toHaveBeenCalledWith(sampleFile);
    expect(controller.phase()).toBe("edit");
    expect(controller.pages).toHaveLength(2);
    expect(controller.statusMessage()).toBe("Ready");
    expect(showToast).toHaveBeenCalledWith("sample.pdf loaded with 2 pages.", "success");
  });

  it("appends pages when adding another PDF", async () => {
    const controller = createController();

    await controller.handleInitialUpload(sampleFile);
    await controller.handleAddPdf(new File(["plain-2"], "append.pdf", { type: "application/pdf" }));

    expect(controller.pages).toHaveLength(4);
    expect(showToast).toHaveBeenLastCalledWith("Added 2 pages from append.pdf.", "success");
  });

  it("retries encrypted uploads through the password prompt", async () => {
    pdfService.loadPDF.mockRejectedValueOnce(new PDFPasswordRequiredError(sampleFile));
    promptForPassword.mockResolvedValue("623");
    pdfService.getPageCount.mockReturnValue(1);

    const controller = createController();

    await controller.handleInitialUpload(sampleFile);

    expect(promptForPassword).toHaveBeenCalledWith("sample.pdf", false);
    expect(pdfService.loadPDFWithPassword).toHaveBeenCalledWith(sampleFile, "623");
    expect(controller.phase()).toBe("edit");
    expect(controller.pages).toHaveLength(1);
  });

  it("extracts the current selection and starts a download", async () => {
    operationsService.buildPDFFromSubset.mockImplementation(
      async (
        _pages: unknown,
        _indices: unknown,
        onProgress?: (progress: { completed: number; total: number }) => void
      ) => {
        onProgress?.({ completed: 1, total: 1 });
        return {
          data: new Uint8Array([1, 2, 3]),
          suggestedFileName: "quire-extract.pdf",
        };
      }
    );

    const controller = createController();

    await controller.handleInitialUpload(sampleFile);
    controller.handlePageClick(0);
    await controller.handleExtract();

    expect(operationsService.buildPDFFromSubset).toHaveBeenCalledWith(
      controller.pages,
      [0],
      expect.any(Function)
    );
    expect(downloadPDF).toHaveBeenCalledWith(
      expect.objectContaining({ suggestedFileName: "quire-extract.pdf" })
    );
    expect(showToast).toHaveBeenCalledWith("Extracted PDF download started.", "success");
    expect(controller.operation()).toBe("idle");
    expect(controller.statusMessage()).toBe("Ready");
  });

  it("builds the full PDF and reports success", async () => {
    operationsService.buildPDF.mockImplementation(
      async (
        _pages: unknown,
        onProgress?: (progress: { completed: number; total: number }) => void
      ) => {
        onProgress?.({ completed: 2, total: 2 });
        return {
          data: new Uint8Array([4, 5, 6]),
          suggestedFileName: "quire-output.pdf",
        };
      }
    );

    const controller = createController();

    await controller.handleInitialUpload(sampleFile);
    await controller.handleDownload();

    expect(operationsService.buildPDF).toHaveBeenCalledWith(controller.pages, expect.any(Function));
    expect(downloadPDF).toHaveBeenCalledWith(
      expect.objectContaining({ suggestedFileName: "quire-output.pdf" })
    );
    expect(showToast).toHaveBeenCalledWith("Download started.", "success");
    expect(controller.operation()).toBe("idle");
    expect(controller.statusMessage()).toBe("Ready");
  });
});

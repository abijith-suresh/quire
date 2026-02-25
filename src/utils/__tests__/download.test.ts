import { describe, it, expect, vi, beforeEach } from "vitest";
import type { PDFOperationResult } from "../../types/interfaces";

vi.mock("file-saver", () => ({
  saveAs: vi.fn(),
}));

const mockPDFOperationResult: PDFOperationResult = {
  data: new Uint8Array([1, 2, 3, 4, 5]),
  suggestedFileName: "pasta-output.pdf",
};

describe("download utility", () => {
  let downloadPDF: typeof import("../download").downloadPDF;
  let saveAsMock: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    vi.clearAllMocks();
    const module = await import("../download");
    downloadPDF = module.downloadPDF;
    const fileSaver = await import("file-saver");
    saveAsMock = fileSaver.saveAs as unknown as ReturnType<typeof vi.fn>;
  });

  it("should create blob with correct MIME type", () => {
    downloadPDF(mockPDFOperationResult);

    expect(saveAsMock).toHaveBeenCalledWith(
      expect.any(Blob),
      mockPDFOperationResult.suggestedFileName
    );

    const blobArg = saveAsMock.mock.calls[0][0] as Blob;
    expect(blobArg.type).toBe("application/pdf");
  });

  it("should call saveAs with expected filename", () => {
    const result: PDFOperationResult = {
      data: new Uint8Array([1, 2, 3]),
      suggestedFileName: "custom-name.pdf",
    };

    downloadPDF(result);

    expect(saveAsMock).toHaveBeenCalledWith(expect.any(Blob), "custom-name.pdf");
  });

  it("should handle empty data", () => {
    const emptyResult: PDFOperationResult = {
      data: new Uint8Array(0),
      suggestedFileName: "empty.pdf",
    };

    downloadPDF(emptyResult);

    expect(saveAsMock).toHaveBeenCalledWith(expect.any(Blob), "empty.pdf");
  });

  it("should pass data to saveAs", () => {
    const testData = new Uint8Array([0x25, 0x50, 0x44, 0x46]);
    const result: PDFOperationResult = {
      data: testData,
      suggestedFileName: "test.pdf",
    };

    downloadPDF(result);

    const blobArg = saveAsMock.mock.calls[0][0] as Blob;
    expect(blobArg.size).toBe(4);
  });
});

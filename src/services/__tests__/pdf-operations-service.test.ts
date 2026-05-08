import { describe, it, expect, beforeEach, vi } from "vitest";
import type { PageState } from "../../types/interfaces";

const createMockPage = (overrides: Partial<PageState> = {}): PageState => ({
  id: "page-1",
  sourceFile: new File([""], "test.pdf"),
  sourcePageNumber: 1,
  rotation: 0,
  markedForDeletion: false,
  ...overrides,
});

const mockCopiedPage = {
  setRotation: vi.fn(),
  getSize: vi.fn().mockReturnValue({ width: 600, height: 800 }),
  drawText: vi.fn(),
};

const mockPDFDoc = {
  copyPages: vi.fn().mockResolvedValue([mockCopiedPage]),
  addPage: vi.fn(),
  embedFont: vi.fn().mockResolvedValue({ widthOfTextAtSize: vi.fn().mockReturnValue(48) }),
  save: vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3])),
  getPageCount: vi.fn().mockReturnValue(1),
};

const mockPDFDocument = {
  load: vi.fn().mockResolvedValue(mockPDFDoc),
  create: vi.fn().mockResolvedValue(mockPDFDoc),
};

vi.mock("pdf-lib", () => ({
  PDFDocument: {
    load: mockPDFDocument.load,
    create: mockPDFDocument.create,
  },
  StandardFonts: { Helvetica: "Helvetica" },
  degrees: vi.fn((deg) => deg),
}));

describe("PDFOperationsService", () => {
  let PDFOperationsService: typeof import("../pdf-operations-service").PDFOperationsService;

  beforeEach(async () => {
    vi.clearAllMocks();
    const module = await import("../pdf-operations-service");
    PDFOperationsService = module.PDFOperationsService;
  });

  describe("buildPDF", () => {
    it("should create PDF from valid pages", async () => {
      const service = new PDFOperationsService();
      const pages = [createMockPage()];

      const result = await service.buildPDF(pages);

      expect(result.data).toBeInstanceOf(Uint8Array);
      expect(result.suggestedFileName).toBe("quire-output.pdf");
    });

    it("should handle multiple pages", async () => {
      const service = new PDFOperationsService();
      const pages = [
        createMockPage({ id: "page-1", sourcePageNumber: 1 }),
        createMockPage({ id: "page-2", sourcePageNumber: 2 }),
      ];

      const result = await service.buildPDF(pages);

      expect(result.data).toBeInstanceOf(Uint8Array);
    });

    it("should throw error when no pages provided", async () => {
      const service = new PDFOperationsService();

      await expect(service.buildPDF([])).rejects.toThrow("No pages to include in the PDF");
    });

    it("should handle page rotation", async () => {
      const service = new PDFOperationsService();
      const rotatedPage = createMockPage({ rotation: 90 });

      const result = await service.buildPDF([rotatedPage]);

      expect(result.data).toBeInstanceOf(Uint8Array);
    });

    it("should throw error when all pages are deleted", async () => {
      const service = new PDFOperationsService();
      const deletedPage = createMockPage({ markedForDeletion: true });

      await expect(service.buildPDF([deletedPage])).rejects.toThrow(
        "No pages to include in the PDF"
      );
    });

    it("should filter out deleted pages", async () => {
      const service = new PDFOperationsService();
      const pages = [
        createMockPage({ id: "page-1", markedForDeletion: false }),
        createMockPage({ id: "page-2", markedForDeletion: true }),
      ];

      const result = await service.buildPDF(pages);

      expect(result.data).toBeInstanceOf(Uint8Array);
    });

    it("should report progress while building", async () => {
      const service = new PDFOperationsService();
      const onProgress = vi.fn();

      await service.buildPDF(
        [createMockPage(), createMockPage({ id: "page-2", sourcePageNumber: 2 })],
        onProgress
      );

      expect(onProgress).toHaveBeenNthCalledWith(1, { completed: 1, total: 2 });
      expect(onProgress).toHaveBeenNthCalledWith(2, { completed: 2, total: 2 });
    });
  });

  describe("buildPDFFromSubset", () => {
    it("should extract specific pages", async () => {
      const service = new PDFOperationsService();
      const pages = [createMockPage()];

      const result = await service.buildPDFFromSubset(pages, [0]);

      expect(result.data).toBeInstanceOf(Uint8Array);
      expect(result.suggestedFileName).toBe("quire-extract.pdf");
    });

    it("should report progress while extracting", async () => {
      const service = new PDFOperationsService();
      const onProgress = vi.fn();

      await service.buildPDFFromSubset([createMockPage()], [0], onProgress);

      expect(onProgress).toHaveBeenCalledWith({ completed: 1, total: 1 });
    });

    it("should handle multiple indices", async () => {
      const service = new PDFOperationsService();
      const pages = [
        createMockPage({ id: "page-1", sourcePageNumber: 1 }),
        createMockPage({ id: "page-2", sourcePageNumber: 2 }),
      ];

      const result = await service.buildPDFFromSubset(pages, [0, 1]);

      expect(result.data).toBeInstanceOf(Uint8Array);
    });

    it("should throw error for invalid indices", async () => {
      const service = new PDFOperationsService();
      const pages = [createMockPage()];

      await expect(service.buildPDFFromSubset(pages, [5])).rejects.toThrow();
    });

    it("should throw error when no pages selected", async () => {
      const service = new PDFOperationsService();
      const pages = [createMockPage()];

      await expect(service.buildPDFFromSubset(pages, [])).rejects.toThrow(
        "No pages selected for extraction"
      );
    });
  });

  describe("addPageNumbers", () => {
    it("adds page numbers using the provided format and position", async () => {
      const service = new PDFOperationsService();

      const result = await service.addPageNumbers(
        [createMockPage(), createMockPage({ id: "page-2", sourcePageNumber: 2 })],
        {
          position: "bottom-right",
          startNumber: 3,
          format: "number-of-total",
          fontSize: 18,
        }
      );

      expect(mockPDFDoc.embedFont).toHaveBeenCalledWith("Helvetica");
      expect(mockCopiedPage.drawText).toHaveBeenCalledWith(
        "3 / 2",
        expect.objectContaining({ size: 18, x: 528, y: 24 })
      );
      expect(result.suggestedFileName).toBe("quire-numbered.pdf");
    });

    it("rejects empty exports", async () => {
      const service = new PDFOperationsService();

      await expect(
        service.addPageNumbers([], {
          position: "bottom-center",
          startNumber: 1,
          format: "number",
          fontSize: 16,
        })
      ).rejects.toThrow("No pages to include in the PDF");
    });
  });

  describe("clearCache", () => {
    it("should clear the cache", () => {
      const service = new PDFOperationsService();

      expect(() => service.clearCache()).not.toThrow();
    });
  });
});

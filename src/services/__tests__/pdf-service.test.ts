import { describe, it, expect, beforeEach, vi } from "vitest";

vi.mock("pdf-lib", () => ({
  PDFDocument: {
    load: vi.fn().mockImplementation((buffer, options) => {
      if (options?.ignoreEncryption) {
        return Promise.resolve({
          getPageCount: vi.fn().mockReturnValue(5),
        });
      }
      throw new Error("PDF is encrypted");
    }),
  },
}));

vi.mock("pdfjs-dist", () => ({
  getDocument: vi.fn().mockImplementation((options) => {
    if (!options) {
      return {
        promise: Promise.resolve({
          getPage: vi.fn().mockResolvedValue({
            getViewport: vi.fn().mockReturnValue({ width: 100, height: 200 }),
            render: vi.fn().mockReturnValue({ promise: Promise.resolve() }),
          }),
        }),
      };
    }
    if (options.password === "wrong") {
      return {
        promise: Promise.reject({ name: "PasswordException", message: "Password required" }),
      };
    }
    if (options.password === "") {
      return {
        promise: Promise.resolve({
          getPage: vi.fn().mockResolvedValue({
            getViewport: vi.fn().mockReturnValue({ width: 100, height: 200 }),
            render: vi.fn().mockReturnValue({ promise: Promise.resolve() }),
          }),
        }),
      };
    }
    return {
      promise: Promise.resolve({
        getPage: vi.fn().mockResolvedValue({
          getViewport: vi.fn().mockReturnValue({ width: 100, height: 200 }),
          render: vi.fn().mockReturnValue({ promise: Promise.resolve() }),
        }),
      }),
    };
  }),
  GlobalWorkerOptions: { workerSrc: "" },
}));

describe("PDFService", () => {
  let PDFService: typeof import("../pdf-service").PDFService;

  beforeEach(async () => {
    vi.clearAllMocks();
    const module = await import("../pdf-service");
    PDFService = module.PDFService;
  });

  describe("loadPDF", () => {
    it("should load an unencrypted PDF", async () => {
      const service = new PDFService();
      const file = new File([""], "test.pdf", { type: "application/pdf" });

      await service.loadPDF(file);

      expect(service.isLoaded()).toBe(true);
      expect(service.getPageCount()).toBe(5);
      expect(service.getFileName()).toBe("test.pdf");
    });

    it("should load owner-password encrypted PDF without password", async () => {
      const service = new PDFService();
      const file = new File([""], "owner-protected.pdf", { type: "application/pdf" });

      await service.loadPDF(file);

      expect(service.isLoaded()).toBe(true);
    });
  });

  describe("loadPDFWithPassword", () => {
    it("should load encrypted PDF with correct password", async () => {
      const service = new PDFService();
      const file = new File([""], "protected.pdf", { type: "application/pdf" });

      await service.loadPDFWithPassword(file, "userpass");

      expect(service.isLoaded()).toBe(true);
      expect(service.getPassword(file)).toBe("userpass");
    });

    it("should throw PDFPasswordRequiredError with wrong password", async () => {
      const service = new PDFService();
      const file = new File([""], "protected.pdf", { type: "application/pdf" });

      await expect(service.loadPDFWithPassword(file, "wrong")).rejects.toThrow();
    });
  });

  describe("getPageCount", () => {
    it("should return page count after loading", async () => {
      const service = new PDFService();
      const file = new File([""], "test.pdf", { type: "application/pdf" });

      await service.loadPDF(file);

      expect(service.getPageCount()).toBe(5);
    });

    it("should return 0 when no PDF loaded", () => {
      const service = new PDFService();

      expect(service.getPageCount()).toBe(0);
    });
  });

  describe("getFileName", () => {
    it("should return filename after loading", async () => {
      const service = new PDFService();
      const file = new File([""], "my-document.pdf", { type: "application/pdf" });

      await service.loadPDF(file);

      expect(service.getFileName()).toBe("my-document.pdf");
    });

    it("should return empty string when no PDF loaded", () => {
      const service = new PDFService();

      expect(service.getFileName()).toBe("");
    });
  });

  describe("isLoaded", () => {
    it("should return false initially", () => {
      const service = new PDFService();

      expect(service.isLoaded()).toBe(false);
    });

    it("should return true after loading", async () => {
      const service = new PDFService();
      const file = new File([""], "test.pdf", { type: "application/pdf" });

      await service.loadPDF(file);

      expect(service.isLoaded()).toBe(true);
    });
  });

  describe("unload", () => {
    it("should reset all state", async () => {
      const service = new PDFService();
      const file = new File([""], "test.pdf", { type: "application/pdf" });

      await service.loadPDF(file);
      service.unload();

      expect(service.isLoaded()).toBe(false);
      expect(service.getFileName()).toBe("");
      expect(service.getPageCount()).toBe(0);
    });
  });

  describe("renderPage", () => {
    it("should throw when no PDF loaded", async () => {
      const service = new PDFService();
      const canvas = document.createElement("canvas");

      await expect(service.renderPage(1, canvas)).rejects.toThrow("No PDF loaded");
    });
  });

  describe("getPageInfo", () => {
    it("should throw when no PDF loaded", async () => {
      const service = new PDFService();

      await expect(service.getPageInfo(1)).rejects.toThrow("No PDF loaded");
    });
  });

  describe("passwordRegistry", () => {
    it("should store password after loading with password", async () => {
      const service = new PDFService();
      const file = new File([""], "protected.pdf", { type: "application/pdf" });

      await service.loadPDFWithPassword(file, "mypassword");

      expect(service.getPassword(file)).toBe("mypassword");
    });

    it("should clear password registry", async () => {
      const service = new PDFService();
      const file = new File([""], "protected.pdf", { type: "application/pdf" });

      await service.loadPDFWithPassword(file, "mypassword");
      service.clearPasswordRegistry();

      expect(service.getPassword(file)).toBeUndefined();
    });
  });

  describe("dispatchLoadedEvent", () => {
    it("should dispatch pdf-loaded event", async () => {
      const service = new PDFService();
      const file = new File([""], "test.pdf", { type: "application/pdf" });

      const dispatchSpy = vi.spyOn(document, "dispatchEvent");
      await service.loadPDF(file);
      service.dispatchLoadedEvent();

      expect(dispatchSpy).toHaveBeenCalled();
      const event = dispatchSpy.mock.calls[0][0] as CustomEvent;
      expect(event.type).toBe("pdf-loaded");
      expect(event.detail.fileName).toBe("test.pdf");
    });
  });
});

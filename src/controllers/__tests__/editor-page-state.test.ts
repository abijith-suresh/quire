import { describe, expect, it } from "vitest";
import { createPageStates, toggleSelectAll, toggleSelection } from "../editor-page-state";

describe("editor page state controller", () => {
  const file = new File(["plain"], "sample.pdf", { type: "application/pdf" });

  it("creates page state entries with source origins for each source page", () => {
    const pageStates = createPageStates(file, 3, 1234);

    expect(pageStates).toEqual([
      {
        id: "sample.pdf-1-1234",
        source: {
          kind: "source-pdf",
          file,
          pageNumber: 1,
        },
        rotation: 0,
        markedForDeletion: false,
      },
      {
        id: "sample.pdf-2-1234",
        source: {
          kind: "source-pdf",
          file,
          pageNumber: 2,
        },
        rotation: 0,
        markedForDeletion: false,
      },
      {
        id: "sample.pdf-3-1234",
        source: {
          kind: "source-pdf",
          file,
          pageNumber: 3,
        },
        rotation: 0,
        markedForDeletion: false,
      },
    ]);
  });

  it("toggles an individual selection by page id", () => {
    expect(toggleSelection(new Set<string>(), "page-1")).toEqual(new Set(["page-1"]));
    expect(toggleSelection(new Set(["page-1", "page-2"]), "page-1")).toEqual(new Set(["page-2"]));
  });

  it("toggles select-all against the current page ids", () => {
    const pages = createPageStates(file, 3, 1234);

    expect(toggleSelectAll(pages, new Set([pages[0].id]))).toEqual(
      new Set([pages[0].id, pages[1].id, pages[2].id])
    );
    expect(toggleSelectAll(pages, new Set(pages.map((page) => page.id)))).toEqual(
      new Set<string>()
    );
  });
});

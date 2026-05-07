import { describe, expect, it } from "vitest";
import {
  createPageStates,
  remapSelectionAfterMove,
  toggleSelectAll,
  toggleSelection,
} from "../editor-page-state";

describe("editor page state controller", () => {
  const file = new File(["plain"], "sample.pdf", { type: "application/pdf" });

  it("creates page state entries for each source page", () => {
    const pageStates = createPageStates(file, 3, { createdAt: 1234 });

    expect(pageStates).toEqual([
      {
        id: "sample.pdf-1-1234",
        sourceFile: file,
        sourcePageNumber: 1,
        sourceEncrypted: false,
        rotation: 0,
        markedForDeletion: false,
      },
      {
        id: "sample.pdf-2-1234",
        sourceFile: file,
        sourcePageNumber: 2,
        sourceEncrypted: false,
        rotation: 0,
        markedForDeletion: false,
      },
      {
        id: "sample.pdf-3-1234",
        sourceFile: file,
        sourcePageNumber: 3,
        sourceEncrypted: false,
        rotation: 0,
        markedForDeletion: false,
      },
    ]);
  });

  it("marks page states created from encrypted PDFs", () => {
    const pageStates = createPageStates(file, 2, { createdAt: 1234, sourceEncrypted: true });

    expect(pageStates.map((page) => page.sourceEncrypted)).toEqual([true, true]);
  });

  it("toggles an individual selection", () => {
    expect(toggleSelection(new Set<number>(), 1)).toEqual(new Set([1]));
    expect(toggleSelection(new Set([1, 2]), 1)).toEqual(new Set([2]));
  });

  it("toggles select-all against the total page count", () => {
    expect(toggleSelectAll(3, new Set([0]))).toEqual(new Set([0, 1, 2]));
    expect(toggleSelectAll(3, new Set([0, 1, 2]))).toEqual(new Set<number>());
  });

  it("remaps selections when an item moves forward", () => {
    const remapped = remapSelectionAfterMove(new Set([0, 1, 3]), 1, 3);
    expect(remapped).toEqual(new Set([0, 2, 3]));
  });

  it("remaps selections when an item moves backward", () => {
    const remapped = remapSelectionAfterMove(new Set([1, 2, 4]), 4, 1);
    expect(remapped).toEqual(new Set([2, 3, 1]));
  });
});

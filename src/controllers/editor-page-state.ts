import type { PageState } from "../types/interfaces";

export function createPageStates(
  file: File,
  pageCount: number,
  createdAt: number = Date.now()
): PageState[] {
  return Array.from({ length: pageCount }, (_, index) => ({
    id: `${file.name}-${index + 1}-${createdAt}`,
    source: {
      kind: "source-pdf",
      file,
      pageNumber: index + 1,
    },
    rotation: 0,
    markedForDeletion: false,
  }));
}

export function toggleSelection(selectedPageIds: Set<string>, pageId: string): Set<string> {
  const next = new Set(selectedPageIds);

  if (next.has(pageId)) {
    next.delete(pageId);
  } else {
    next.add(pageId);
  }

  return next;
}

export function toggleSelectAll(pages: PageState[], selectedPageIds: Set<string>): Set<string> {
  const pageIds = pages.map((page) => page.id);

  if (selectedPageIds.size === pageIds.length) {
    return new Set<string>();
  }

  return new Set(pageIds);
}

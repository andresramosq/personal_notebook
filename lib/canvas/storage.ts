import type { CanvasDocument, CanvasItem } from "@/lib/canvas/types";

const STORAGE_KEY = "libreta:canvas:v1";

const EMPTY_DOCUMENT: CanvasDocument = {
  version: 1,
  items: [],
};

export function loadCanvasItems(): CanvasItem[] {
  try {
    const value = window.localStorage.getItem(STORAGE_KEY);

    if (!value) {
      return EMPTY_DOCUMENT.items;
    }

    const document = JSON.parse(value) as Partial<CanvasDocument>;

    if (document.version !== 1 || !Array.isArray(document.items)) {
      return EMPTY_DOCUMENT.items;
    }

    return document.items;
  } catch {
    return EMPTY_DOCUMENT.items;
  }
}

export function saveCanvasItems(items: CanvasItem[]) {
  const document: CanvasDocument = {
    version: 1,
    items,
  };

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(document));
}

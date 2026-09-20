export type ItemKind = "note" | "text" | "board" | "link" | "image";
export type CanvasMode = "select" | "hand" | "connect";
export type ItemColor = "white" | "sand" | "yellow" | "blue" | "green" | "rose";

export type WorkspaceCanvas = {
  id: string;
  name: string;
  parentId: string | null;
  createdAt: number;
  updatedAt: number;
};

export type CanvasItem = {
  id: string;
  canvasId: string;
  kind: ItemKind;
  title: string;
  content: string;
  url: string;
  nestedCanvasId: string | null;
  x: number;
  y: number;
  width: number;
  height: number;
  color: ItemColor;
  createdAt: number;
  updatedAt: number;
};

export type CanvasLink = {
  id: string;
  canvasId: string;
  fromId: string;
  toId: string;
};

export type CanvasCamera = {
  x: number;
  y: number;
  zoom: number;
};

export type WorkspaceState = {
  version: 3;
  canvases: WorkspaceCanvas[];
  items: CanvasItem[];
  links: CanvasLink[];
  cameras: Record<string, CanvasCamera>;
  activeCanvasId: string;
};

export type PaletteKind = ItemKind | "connect";

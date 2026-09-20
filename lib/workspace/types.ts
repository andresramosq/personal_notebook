export type ItemKind = "note" | "text" | "checklist";
export type CanvasMode = "select" | "hand";
export type ItemColor = "white" | "sand" | "yellow" | "blue" | "green" | "rose";

export type ChecklistEntry = {
  id: string;
  text: string;
  checked: boolean;
};

export type WorkspaceCanvas = {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
};

export type CanvasItem = {
  id: string;
  canvasId: string;
  kind: ItemKind;
  title: string;
  content: string;
  checklist: ChecklistEntry[];
  x: number;
  y: number;
  width: number;
  height: number;
  color: ItemColor;
  createdAt: number;
  updatedAt: number;
};

export type CanvasCamera = {
  x: number;
  y: number;
  zoom: number;
};

export type WorkspaceState = {
  version: 2;
  canvases: WorkspaceCanvas[];
  items: CanvasItem[];
  cameras: Record<string, CanvasCamera>;
  activeCanvasId: string;
};

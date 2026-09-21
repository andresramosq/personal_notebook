export type ItemKind =
  | "note"
  | "text"
  | "board"
  | "link"
  | "image"
  | "video"
  | "file"
  | "column"
  | "table"
  | "database"
  | "drawing"
  | "todo"
  | "kanban"
  | "comment"
  | "line";
export type CanvasMode = "select" | "hand" | "connect" | "draw" | "line";
export type ItemColor = "white" | "sand" | "yellow" | "blue" | "green" | "rose";
export type DatabaseFieldType =
  | "text"
  | "number"
  | "date"
  | "select"
  | "checkbox";

export type DrawingPoint = {
  x: number;
  y: number;
};

export type DatabaseField = {
  id: string;
  name: string;
  type: DatabaseFieldType;
  options: string[];
};

export type DatabaseCellValue = string | boolean;

export type DatabaseRecord = {
  id: string;
  cells: Record<string, DatabaseCellValue>;
  createdAt: number;
  updatedAt: number;
};

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
  caption: string;
  nestedCanvasId: string | null;
  parentColumnId: string | null;
  sortOrder: number;
  inUnsorted: boolean;
  databaseFields: DatabaseField[];
  databaseRecords: DatabaseRecord[];
  points: DrawingPoint[];
  strokeColor: string;
  strokeWidth: number;
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

export type TrashEntry = {
  item: CanvasItem;
  deletedAt: number;
};

export type WorkspaceState = {
  version: 3;
  canvases: WorkspaceCanvas[];
  items: CanvasItem[];
  links: CanvasLink[];
  cameras: Record<string, CanvasCamera>;
  trash: TrashEntry[];
  activeCanvasId: string;
};

export type PaletteKind = ItemKind | "connect" | "draw" | "trash" | "upload";

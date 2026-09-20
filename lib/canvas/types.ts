export type CanvasItemType = "note" | "task" | "text" | "shape";

export type CanvasItem = {
  id: string;
  type: CanvasItemType;
  x: number;
  y: number;
  width: number;
  height: number;
  title: string;
  content: string;
  completed: boolean;
  color: string;
  createdAt: number;
  updatedAt: number;
};

export type CanvasDocument = {
  version: 1;
  items: CanvasItem[];
};

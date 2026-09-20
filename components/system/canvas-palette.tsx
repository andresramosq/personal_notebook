"use client";

import { Icon } from "@/components/system/icon";
import type { CanvasMode, ItemKind, PaletteKind } from "@/lib/workspace/types";

const TOOLS: Array<{
  kind: PaletteKind;
  icon:
    | "note"
    | "link"
    | "todo"
    | "line"
    | "kanban"
    | "board"
    | "comment"
    | "database"
    | "image"
    | "upload"
    | "pen"
    | "connect"
    | "trash";
  label: string;
  section?: "main" | "bottom";
}> = [
  { kind: "note", icon: "note", label: "Nota", section: "main" },
  { kind: "link", icon: "link", label: "Enlace", section: "main" },
  { kind: "todo", icon: "todo", label: "To-do", section: "main" },
  { kind: "line", icon: "line", label: "Línea", section: "main" },
  { kind: "kanban", icon: "kanban", label: "Tablero", section: "main" },
  { kind: "board", icon: "board", label: "Pizarra", section: "main" },
  { kind: "comment", icon: "comment", label: "Comenta", section: "main" },
  { kind: "database", icon: "database", label: "Tabla", section: "main" },
  { kind: "image", icon: "image", label: "Imagen", section: "bottom" },
  { kind: "image", icon: "upload", label: "Subir", section: "bottom" },
  { kind: "draw", icon: "pen", label: "Dibujar", section: "bottom" },
  { kind: "connect", icon: "connect", label: "Unir", section: "bottom" },
  { kind: "trash", icon: "trash", label: "Papelera", section: "bottom" },
];

type CanvasPaletteProps = {
  mode: CanvasMode;
  trashCount: number;
  onModeChange: (mode: CanvasMode) => void;
  onDragKind: (kind: ItemKind) => void;
  onOpenTrash: () => void;
};

export function CanvasPalette({
  mode,
  trashCount,
  onModeChange,
  onDragKind,
  onOpenTrash,
}: CanvasPaletteProps) {
  const renderTool = (tool: (typeof TOOLS)[number]) => {
    const isConnect = tool.kind === "connect";
    const isDraw = tool.kind === "draw";
    const isLine = tool.kind === "line";
    const isTrash = tool.kind === "trash";
    const isModeTool = isConnect || isDraw || isLine;
    const isActive =
      (isConnect && mode === "connect") ||
      (isDraw && mode === "draw") ||
      (isLine && mode === "line");

    return (
      <button
        key={`${tool.kind}-${tool.label}`}
        type="button"
        className={`canvas-palette-item ${isActive ? "is-active" : ""}`}
        draggable={!isModeTool && !isTrash}
        onClick={() => {
          if (isTrash) {
            onOpenTrash();
            return;
          }
          if (isConnect) {
            onModeChange("connect");
            return;
          }
          if (isDraw) {
            onModeChange("draw");
            return;
          }
          if (isLine) {
            onModeChange("line");
            return;
          }
          onModeChange("select");
        }}
        onDragStart={(event) => {
          if (isModeTool || isTrash) return;
          event.dataTransfer.setData(
            "application/x-libreta-item",
            tool.kind as ItemKind,
          );
          event.dataTransfer.setData("text/plain", tool.kind);
          event.dataTransfer.effectAllowed = "copy";
          onDragKind(tool.kind as ItemKind);
        }}
        title={tool.label}
      >
        <span className="canvas-palette-icon">
          <Icon name={tool.icon} size={18} />
        </span>
        <span className="canvas-palette-label">{tool.label}</span>
        {isTrash && trashCount > 0 ? (
          <span className="canvas-palette-badge">{trashCount}</span>
        ) : null}
      </button>
    );
  };

  return (
    <aside className="canvas-palette">
      <div className="canvas-palette-brand">
        <span className="app-logo">L</span>
        <span>Inicio</span>
      </div>
      <div className="canvas-palette-tools">
        {TOOLS.filter((tool) => tool.section === "main").map(renderTool)}
      </div>
      <div className="canvas-palette-divider" />
      <div className="canvas-palette-tools canvas-palette-tools-bottom">
        {TOOLS.filter((tool) => tool.section === "bottom").map(renderTool)}
      </div>
    </aside>
  );
}

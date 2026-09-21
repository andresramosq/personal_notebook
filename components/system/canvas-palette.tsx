"use client";

import { useRef } from "react";
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
  { kind: "column", icon: "kanban", label: "Columna", section: "main" },
  { kind: "board", icon: "board", label: "Tablero", section: "main" },
  { kind: "comment", icon: "comment", label: "Comentario", section: "main" },
  { kind: "table", icon: "database", label: "Tabla", section: "main" },
  { kind: "video", icon: "image", label: "Video", section: "main" },
  { kind: "line", icon: "line", label: "Línea", section: "bottom" },
  { kind: "upload", icon: "upload", label: "Subir", section: "bottom" },
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
  onUploadFiles: (files: FileList) => void;
};

export function CanvasPalette({
  mode,
  trashCount,
  onModeChange,
  onDragKind,
  onOpenTrash,
  onUploadFiles,
}: CanvasPaletteProps) {
  const uploadRef = useRef<HTMLInputElement>(null);

  const renderTool = (tool: (typeof TOOLS)[number]) => {
    const isConnect = tool.kind === "connect";
    const isDraw = tool.kind === "draw";
    const isLine = tool.kind === "line";
    const isTrash = tool.kind === "trash";
    const isUpload = tool.kind === "upload";
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
        draggable={!isModeTool && !isTrash && !isUpload}
        onClick={() => {
          if (isTrash) {
            onOpenTrash();
            return;
          }
          if (isUpload) {
            uploadRef.current?.click();
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
          if (isModeTool || isTrash || isUpload) return;
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
      <input
        ref={uploadRef}
        type="file"
        hidden
        multiple
        accept=".jpg,.jpeg,.png,.gif,.webp,.svg,.mp4,.webm,.mov,.pdf,.zip,.txt,.md,image/*,video/*,application/pdf"
        onChange={(event) => {
          if (event.target.files?.length) {
            onUploadFiles(event.target.files);
            event.target.value = "";
          }
        }}
      />
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

"use client";

import { useRef } from "react";
import { Icon } from "@/components/system/icon";
import type { CanvasMode, ItemKind, PaletteKind } from "@/lib/workspace/types";

/** Orden y tipos iguales a la barra izquierda de Milanote */
const TOOLS: Array<{
  kind: PaletteKind;
  icon:
    | "note"
    | "image"
    | "todo"
    | "link"
    | "kanban"
    | "comment"
    | "database"
    | "board"
    | "upload"
    | "pen"
    | "trash";
  label: string;
  section?: "main" | "bottom";
}> = [
  { kind: "note", icon: "note", label: "Nota", section: "main" },
  { kind: "image", icon: "image", label: "Imagen", section: "main" },
  { kind: "todo", icon: "todo", label: "To-do", section: "main" },
  { kind: "link", icon: "link", label: "Enlace", section: "main" },
  { kind: "column", icon: "kanban", label: "Columna", section: "main" },
  { kind: "comment", icon: "comment", label: "Comentario", section: "main" },
  { kind: "table", icon: "database", label: "Tabla", section: "main" },
  { kind: "video", icon: "image", label: "Video", section: "main" },
  { kind: "draw", icon: "pen", label: "Boceto", section: "main" },
  { kind: "upload", icon: "upload", label: "Archivo", section: "main" },
  { kind: "board", icon: "board", label: "Tablero", section: "main" },
  { kind: "trash", icon: "trash", label: "Papelera", section: "bottom" },
];

type CanvasPaletteProps = {
  mode: CanvasMode;
  placementKind: ItemKind | null;
  trashCount: number;
  onModeChange: (mode: CanvasMode) => void;
  onPlacementKind: (kind: ItemKind | null) => void;
  onOpenTrash: () => void;
  onUploadFiles: (files: FileList) => void;
};

export function CanvasPalette({
  mode,
  placementKind,
  trashCount,
  onModeChange,
  onPlacementKind,
  onOpenTrash,
  onUploadFiles,
}: CanvasPaletteProps) {
  const uploadRef = useRef<HTMLInputElement>(null);

  const renderTool = (tool: (typeof TOOLS)[number]) => {
    const isDraw = tool.kind === "draw";
    const isTrash = tool.kind === "trash";
    const isUpload = tool.kind === "upload";
    const isBlock = !isDraw && !isTrash && !isUpload;
    const isActive =
      (isDraw && mode === "draw") ||
      (isBlock && placementKind === tool.kind);

    return (
      <button
        key={`${tool.kind}-${tool.label}`}
        type="button"
        className={`canvas-palette-item ${isActive ? "is-active" : ""}`}
        draggable={isBlock}
        onClick={() => {
          if (isTrash) {
            onOpenTrash();
            return;
          }
          if (isUpload) {
            uploadRef.current?.click();
            return;
          }
          if (isDraw) {
            onPlacementKind(null);
            onModeChange("draw");
            return;
          }
          onModeChange("select");
          onPlacementKind(tool.kind as ItemKind);
        }}
        onDragStart={(event) => {
          if (!isBlock) return;
          event.dataTransfer.setData(
            "application/x-libreta-item",
            tool.kind as ItemKind,
          );
          event.dataTransfer.setData("text/plain", tool.kind);
          event.dataTransfer.effectAllowed = "copy";
          onPlacementKind(tool.kind as ItemKind);
        }}
        onDragEnd={() => onPlacementKind(null)}
        title={tool.label}
        aria-label={tool.label}
      >
        <span className="canvas-palette-icon">
          <Icon name={tool.icon} size={20} />
        </span>
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

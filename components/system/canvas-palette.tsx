"use client";

import { Icon } from "@/components/system/icon";
import type { CanvasMode } from "@/lib/workspace/types";

type CanvasPaletteProps = {
  mode: CanvasMode;
  onModeChange: (mode: CanvasMode) => void;
  onAddBoard: () => void;
};

export function CanvasPalette({
  mode,
  onModeChange,
  onAddBoard,
}: CanvasPaletteProps) {
  return (
    <aside className="canvas-palette canvas-palette-minimal">
      <div className="canvas-palette-brand">
        <span className="app-logo">L</span>
        <span>Inicio</span>
      </div>
      <div className="canvas-palette-tools">
        <button
          type="button"
          className={`canvas-palette-item ${mode === "select" ? "is-active" : ""}`}
          onClick={() => onModeChange("select")}
          title="Seleccionar"
        >
          <span className="canvas-palette-icon">
            <Icon name="select" size={18} />
          </span>
          <span className="canvas-palette-label">Seleccionar</span>
        </button>
        <button
          type="button"
          className={`canvas-palette-item ${mode === "hand" ? "is-active" : ""}`}
          onClick={() => onModeChange("hand")}
          title="Mover lienzo"
        >
          <span className="canvas-palette-icon">
            <Icon name="hand" size={18} />
          </span>
          <span className="canvas-palette-label">Mover</span>
        </button>
        <button
          type="button"
          className="canvas-palette-item"
          draggable
          onClick={onAddBoard}
          onDragStart={(event) => {
            event.dataTransfer.setData("application/x-libreta-item", "board");
            event.dataTransfer.setData("text/plain", "board");
            event.dataTransfer.effectAllowed = "copy";
          }}
          title="Pizarra anidada"
        >
          <span className="canvas-palette-icon">
            <Icon name="board" size={18} />
          </span>
          <span className="canvas-palette-label">Pizarra</span>
        </button>
      </div>
    </aside>
  );
}

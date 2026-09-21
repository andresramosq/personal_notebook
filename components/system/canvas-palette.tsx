"use client";

import { Icon } from "@/components/system/icon";

type CanvasPaletteProps = {
  onAddBoard: () => void;
};

export function CanvasPalette({ onAddBoard }: CanvasPaletteProps) {
  return (
    <aside className="canvas-palette canvas-palette-minimal">
      <div className="canvas-palette-brand">
        <span className="app-logo">L</span>
      </div>
      <div className="canvas-palette-tools">
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
          title="Tablero"
        >
          <span className="canvas-palette-icon">
            <Icon name="board" size={18} />
          </span>
          <span className="canvas-palette-label">Tablero</span>
        </button>
      </div>
    </aside>
  );
}

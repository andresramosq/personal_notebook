"use client";

import type { CanvasItemType } from "@/lib/canvas/types";

type CanvasToolbarProps = {
  onCreate: (type: CanvasItemType) => void;
  onResetView: () => void;
  zoom: number;
};

const TOOLS: Array<{
  type: CanvasItemType;
  label: string;
  symbol: string;
}> = [
  { type: "note", label: "Nota", symbol: "N" },
  { type: "task", label: "Tarea", symbol: "✓" },
  { type: "text", label: "Texto", symbol: "T" },
  { type: "shape", label: "Figura", symbol: "□" },
];

export function CanvasToolbar({
  onCreate,
  onResetView,
  zoom,
}: CanvasToolbarProps) {
  return (
    <>
      <aside className="workspace-toolbar" aria-label="Objetos del lienzo">
        <div className="workspace-toolbar__brand">L</div>
        <div className="workspace-toolbar__tools">
          {TOOLS.map((tool) => (
            <button
              key={tool.type}
              type="button"
              className="workspace-tool"
              onClick={() => onCreate(tool.type)}
            >
              <span className="workspace-tool__symbol">{tool.symbol}</span>
              <span>{tool.label}</span>
            </button>
          ))}
        </div>
      </aside>

      <div className="workspace-zoom">
        <span>{Math.round(zoom * 100)}%</span>
        <button type="button" onClick={onResetView}>
          Centrar
        </button>
      </div>
    </>
  );
}

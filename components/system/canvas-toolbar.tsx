"use client";

import type { CanvasTool } from "@/lib/workspace/types";

type CanvasToolbarProps = {
  activeTool: CanvasTool;
  onChange: (tool: CanvasTool) => void;
};

const TOOLS: Array<{ id: CanvasTool; icon: string; label: string; key: string }> =
  [
    { id: "select", icon: "↖", label: "Seleccionar", key: "V" },
    { id: "hand", icon: "✋", label: "Mover lienzo", key: "H" },
    { id: "draw", icon: "✎", label: "Dibujar", key: "D" },
    { id: "rectangle", icon: "□", label: "Rectángulo", key: "R" },
    { id: "ellipse", icon: "○", label: "Elipse", key: "O" },
    { id: "text", icon: "T", label: "Texto", key: "T" },
    { id: "note", icon: "▤", label: "Nota", key: "N" },
    { id: "page", icon: "▱", label: "Página", key: "P" },
    { id: "database", icon: "▦", label: "Base de datos", key: "B" },
    { id: "connect", icon: "↗", label: "Conectar", key: "C" },
  ];

export function CanvasToolbar({
  activeTool,
  onChange,
}: CanvasToolbarProps) {
  return (
    <div className="creative-toolbar" aria-label="Herramientas del lienzo">
      {TOOLS.map((tool) => (
        <button
          key={tool.id}
          type="button"
          className={activeTool === tool.id ? "is-active" : ""}
          onClick={() => onChange(tool.id)}
          title={`${tool.label} (${tool.key})`}
        >
          <span>{tool.icon}</span>
          <small>{tool.key}</small>
        </button>
      ))}
    </div>
  );
}

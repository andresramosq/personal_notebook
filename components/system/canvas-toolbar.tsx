"use client";

import { Icon } from "@/components/system/icon";
import type { CanvasMode, ItemKind } from "@/lib/workspace/types";

type CanvasToolbarProps = {
  mode: CanvasMode;
  onModeChange: (mode: CanvasMode) => void;
  onCreate: (kind: ItemKind) => void;
};

export function CanvasToolbar({
  mode,
  onModeChange,
  onCreate,
}: CanvasToolbarProps) {
  const createTools: Array<{
    kind: ItemKind;
    icon: "note" | "text" | "check";
    label: string;
  }> = [
    { kind: "note", icon: "note", label: "Nota" },
    { kind: "text", icon: "text", label: "Texto" },
    { kind: "checklist", icon: "check", label: "Lista" },
  ];

  return (
    <div
      className="canvas-toolbar"
      aria-label="Herramientas del lienzo"
      onPointerDown={(event) => event.stopPropagation()}
      onDoubleClick={(event) => event.stopPropagation()}
    >
      <div className="toolbar-group">
        <button
          type="button"
          className={mode === "select" ? "is-active" : ""}
          onClick={() => onModeChange("select")}
          title="Seleccionar (V)"
        >
          <Icon name="select" />
        </button>
        <button
          type="button"
          className={mode === "hand" ? "is-active" : ""}
          onClick={() => onModeChange("hand")}
          title="Mover lienzo (H)"
        >
          <Icon name="hand" />
        </button>
      </div>
      <span className="toolbar-divider" />
      <div className="toolbar-group">
        {createTools.map((tool) => (
          <button
            key={tool.kind}
            type="button"
            draggable
            onClick={() => onCreate(tool.kind)}
            onDragStart={(event) => {
              event.dataTransfer.setData(
                "application/x-libreta-item",
                tool.kind,
              );
              event.dataTransfer.setData("text/plain", tool.kind);
              event.dataTransfer.effectAllowed = "copy";
            }}
            title={`${tool.label} · clic o arrastra al lienzo`}
          >
            <Icon name={tool.icon} />
            <span>{tool.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

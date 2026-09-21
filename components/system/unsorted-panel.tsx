"use client";

import type { CanvasItem } from "@/lib/workspace/types";

type UnsortedPanelProps = {
  open: boolean;
  items: CanvasItem[];
  onClose: () => void;
  onDragItem: (itemId: string, event: React.DragEvent<HTMLDivElement>) => void;
};

function labelForItem(item: CanvasItem) {
  if (item.title.trim()) return item.title;
  if (item.kind === "image") return "Imagen";
  if (item.kind === "video") return "Video";
  if (item.kind === "file") return item.title || "Archivo";
  return item.kind;
}

export function UnsortedPanel({
  open,
  items,
  onClose,
  onDragItem,
}: UnsortedPanelProps) {
  if (!open) return null;

  return (
    <aside className="unsorted-panel">
      <header>
        <strong>Sin clasificar</strong>
        <button type="button" onClick={onClose} aria-label="Cerrar">
          ×
        </button>
      </header>
      <p className="unsorted-help">
        Arrastra estos elementos al tablero para colocarlos.
      </p>
      <ul className="unsorted-list">
        {items.map((item) => (
          <li key={item.id}>
            <div
              className="unsorted-item"
              draggable
              onDragStart={(event) => onDragItem(item.id, event)}
            >
              <span className={`unsorted-chip color-${item.color}`} />
              <span>{labelForItem(item)}</span>
            </div>
          </li>
        ))}
        {!items.length ? (
          <li className="unsorted-empty">No hay elementos sin clasificar</li>
        ) : null}
      </ul>
    </aside>
  );
}

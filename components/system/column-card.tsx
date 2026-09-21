"use client";

import { memo, useEffect, useRef, useState } from "react";
import { ObjectCard } from "@/components/system/object-card";
import { parseColumnContent } from "@/lib/workspace/blocks";
import type { CanvasItem, ItemKind } from "@/lib/workspace/types";

type ColumnCardProps = {
  item: CanvasItem;
  children: CanvasItem[];
  zoom: number;
  selectedId: string | null;
  onSelect: () => void;
  onMove: (x: number, y: number) => void;
  onResize: (width: number, height: number) => void;
  onUpdate: (changes: Partial<CanvasItem>) => void;
  onDelete: () => void;
  onChildUpdate: (id: string, changes: Partial<CanvasItem>) => void;
  onChildDelete: (id: string) => void;
  onChildSelect: (id: string) => void;
  onAssignChild: (childId: string, sortOrder: number) => void;
  onCreateInColumn: (kind: ItemKind, sortOrder: number) => void;
  onEnterBoard: (item: CanvasItem) => void;
};

export const ColumnCard = memo(function ColumnCard({
  item,
  children,
  zoom,
  selectedId,
  onSelect,
  onMove,
  onResize,
  onUpdate,
  onDelete,
  onChildUpdate,
  onChildDelete,
  onChildSelect,
  onAssignChild,
  onCreateInColumn,
  onEnterBoard,
}: ColumnCardProps) {
  const [position, setPosition] = useState({ x: item.x, y: item.y });
  const positionRef = useRef(position);
  const bodyRef = useRef<HTMLDivElement>(null);
  const [dropIndex, setDropIndex] = useState<number | null>(null);
  const columnMeta = parseColumnContent(item.content);
  const sortedChildren = [...children].sort((a, b) => a.sortOrder - b.sortOrder);

  useEffect(() => {
    const next = { x: item.x, y: item.y };
    positionRef.current = next;
    setPosition(next);
  }, [item.x, item.y]);

  const resolveDropIndex = (clientY: number) => {
    const body = bodyRef.current;
    if (!body) return sortedChildren.length;
    const rows = body.querySelectorAll(".column-child-wrap");
    if (!rows.length) return 0;
    for (let index = 0; index < rows.length; index += 1) {
      const row = rows[index] as HTMLElement;
      const rect = row.getBoundingClientRect();
      if (clientY < rect.top + rect.height / 2) return index;
    }
    return rows.length;
  };

  const handleColumnDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    const sortOrder = dropIndex ?? sortedChildren.length;
    setDropIndex(null);

    const childId =
      event.dataTransfer.getData("application/x-libreta-move-item") ||
      event.dataTransfer.getData("application/x-libreta-unsorted-item");
    if (childId) {
      onAssignChild(childId, sortOrder);
      return;
    }

    const kind = (event.dataTransfer.getData("application/x-libreta-item") ||
      event.dataTransfer.getData("text/plain")) as ItemKind;
    if (kind) {
      onCreateInColumn(kind, sortOrder);
    }
  };

  const startDrag = (event: React.PointerEvent<HTMLElement>) => {
    if (event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();
    onSelect();

    const start = { x: event.clientX, y: event.clientY };
    const origin = positionRef.current;
    const move = (moveEvent: PointerEvent) => {
      const next = {
        x: origin.x + (moveEvent.clientX - start.x) / zoom,
        y: origin.y + (moveEvent.clientY - start.y) / zoom,
      };
      positionRef.current = next;
      setPosition(next);
    };
    const stop = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", stop);
      onMove(positionRef.current.x, positionRef.current.y);
    };

    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", stop, { once: true });
  };

  const startResize = (event: React.PointerEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    const start = { x: event.clientX, y: event.clientY };
    const origin = { width: item.width, height: item.height };
    const move = (moveEvent: PointerEvent) => {
      onResize(
        Math.max(220, origin.width + (moveEvent.clientX - start.x) / zoom),
        Math.max(160, origin.height + (moveEvent.clientY - start.y) / zoom),
      );
    };
    const stop = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", stop);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", stop, { once: true });
  };

  return (
    <article
      className={`canvas-item item-column color-${item.color} ${
        selectedId === item.id ? "is-selected" : ""
      }`}
      style={{
        transform: `translate3d(${position.x}px, ${position.y}px, 0)`,
        width: item.width,
        height: item.height,
      }}
      onPointerDown={(event) => {
        event.stopPropagation();
        onSelect();
      }}
    >
      <div className="column-card" onPointerDown={startDrag}>
        <div className="column-card-header">
          <input
            className="column-card-title"
            value={item.title}
            onPointerDown={(event) => event.stopPropagation()}
            onChange={(event) => onUpdate({ title: event.target.value })}
          />
          <button
            type="button"
            className="column-collapse"
            onPointerDown={(event) => event.stopPropagation()}
            onClick={() =>
              onUpdate({
                content: JSON.stringify({ collapsed: !columnMeta.collapsed }),
              })
            }
            aria-label={columnMeta.collapsed ? "Expandir" : "Colapsar"}
          >
            {columnMeta.collapsed ? "+" : "−"}
          </button>
        </div>

        {!columnMeta.collapsed ? (
          <div
            ref={bodyRef}
            className="column-card-body"
            onDragOver={(event) => {
              event.preventDefault();
              event.dataTransfer.dropEffect = "move";
              setDropIndex(resolveDropIndex(event.clientY));
            }}
            onDragLeave={() => setDropIndex(null)}
            onDrop={handleColumnDrop}
          >
            {sortedChildren.length ? (
              sortedChildren.map((child, index) => (
                <div key={child.id} className="column-child-wrap">
                  {dropIndex === index ? (
                    <div className="column-drop-line" />
                  ) : null}
                  <ObjectCard
                    item={child}
                    zoom={1}
                    selected={selectedId === child.id}
                    embedded
                    onSelect={() => onChildSelect(child.id)}
                    onMove={() => undefined}
                    onResize={(width, height) =>
                      onChildUpdate(child.id, { width, height })
                    }
                    onUpdate={(changes) => onChildUpdate(child.id, changes)}
                    onDelete={() => onChildDelete(child.id)}
                    onEnterBoard={() => onEnterBoard(child)}
                    onPrepareDrag={(event) => {
                      event.dataTransfer.setData(
                        "application/x-libreta-move-item",
                        child.id,
                      );
                      event.dataTransfer.effectAllowed = "move";
                    }}
                  />
                </div>
              ))
            ) : (
              <span className="column-empty">Arrastra tarjetas aquí</span>
            )}
            {dropIndex === sortedChildren.length && sortedChildren.length ? (
              <div className="column-drop-line" />
            ) : null}
          </div>
        ) : (
          <div className="column-card-count">{sortedChildren.length} tarjetas</div>
        )}
      </div>

      {selectedId === item.id ? (
        <>
          <button
            type="button"
            className="item-action-delete column-delete"
            onClick={onDelete}
            aria-label="Eliminar columna"
          >
            ×
          </button>
          <button
            type="button"
            className="resize-handle"
            onPointerDown={startResize}
            aria-label="Redimensionar columna"
          />
        </>
      ) : null}
    </article>
  );
});

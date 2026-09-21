"use client";

import { memo, useEffect, useRef, useState } from "react";
import { ObjectCard } from "@/components/system/object-card";
import { parseColumnContent } from "@/lib/workspace/blocks";
import type { CanvasItem } from "@/lib/workspace/types";

type ColumnCardProps = {
  item: CanvasItem;
  children: CanvasItem[];
  zoom: number;
  selectedId: string | null;
  linking: boolean;
  onSelect: () => void;
  onMove: (x: number, y: number) => void;
  onResize: (width: number, height: number) => void;
  onUpdate: (changes: Partial<CanvasItem>) => void;
  onDelete: () => void;
  onChildUpdate: (id: string, changes: Partial<CanvasItem>) => void;
  onChildDelete: (id: string) => void;
  onChildSelect: (id: string) => void;
  onAssignChild: (childId: string, sortOrder: number) => void;
  onEnterBoard: (item: CanvasItem) => void;
  onOpenDatabase: (item: CanvasItem) => void;
};

export const ColumnCard = memo(function ColumnCard({
  item,
  children,
  zoom,
  selectedId,
  linking,
  onSelect,
  onMove,
  onResize,
  onUpdate,
  onDelete,
  onChildUpdate,
  onChildDelete,
  onChildSelect,
  onAssignChild,
  onEnterBoard,
  onOpenDatabase,
}: ColumnCardProps) {
  const [position, setPosition] = useState({ x: item.x, y: item.y });
  const positionRef = useRef(position);
  const columnMeta = parseColumnContent(item.content);
  const sortedChildren = [...children].sort((a, b) => a.sortOrder - b.sortOrder);

  useEffect(() => {
    const next = { x: item.x, y: item.y };
    positionRef.current = next;
    setPosition(next);
  }, [item.x, item.y]);

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
          >
            {columnMeta.collapsed ? "+" : "−"}
          </button>
        </div>

        {!columnMeta.collapsed ? (
          <div
            className="column-card-body"
            onDragOver={(event) => {
              event.preventDefault();
              event.dataTransfer.dropEffect = "move";
            }}
            onDrop={(event) => {
              event.preventDefault();
              event.stopPropagation();
              const childId =
                event.dataTransfer.getData("application/x-libreta-move-item") ||
                event.dataTransfer.getData("application/x-libreta-unsorted-item");
              if (!childId) return;
              onAssignChild(childId, sortedChildren.length);
            }}
          >
            {sortedChildren.length ? (
              sortedChildren.map((child) => (
                <div key={child.id} className="column-child-wrap">
                  <ObjectCard
                    item={child}
                    zoom={1}
                    selected={selectedId === child.id}
                    linking={linking}
                    nestedPreview={[]}
                    embedded
                    onSelect={() => onChildSelect(child.id)}
                    onMove={() => undefined}
                    onResize={(width, height) =>
                      onChildUpdate(child.id, { width, height })
                    }
                    onUpdate={(changes) => onChildUpdate(child.id, changes)}
                    onDelete={() => onChildDelete(child.id)}
                    onEnterBoard={() => onEnterBoard(child)}
                    onOpenDatabase={() => onOpenDatabase(child)}
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
          </div>
        ) : (
          <div className="column-card-count">{sortedChildren.length} elementos</div>
        )}
      </div>

      {selectedId === item.id ? (
        <button
          type="button"
          className="resize-handle"
          onPointerDown={startResize}
          aria-label="Redimensionar columna"
        />
      ) : null}
    </article>
  );
});

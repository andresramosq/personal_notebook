"use client";

import { memo, useEffect, useRef, useState } from "react";
import { BoardContextMenu } from "@/components/system/board-context-menu";
import type { CanvasItem } from "@/lib/workspace/types";

type BoardCardProps = {
  item: CanvasItem;
  zoom: number;
  selected: boolean;
  onSelect: () => void;
  onMove: (x: number, y: number) => void;
  onUpdate: (changes: Partial<CanvasItem>) => void;
  onDelete: () => void;
  onEnterBoard: () => void;
};

export const BoardCard = memo(function BoardCard({
  item,
  zoom,
  selected,
  onSelect,
  onMove,
  onUpdate,
  onDelete,
  onEnterBoard,
}: BoardCardProps) {
  const [position, setPosition] = useState({ x: item.x, y: item.y });
  const positionRef = useRef(position);
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null);
  const [renaming, setRenaming] = useState(false);
  const renameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const next = { x: item.x, y: item.y };
    positionRef.current = next;
    setPosition(next);
  }, [item.x, item.y]);

  useEffect(() => {
    if (renaming) renameRef.current?.focus();
  }, [renaming]);

  const startDrag = (event: React.PointerEvent<HTMLElement>) => {
    if (event.button !== 0 || renaming) return;
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

  return (
    <>
      <article
        className={`canvas-item item-board ${selected ? "is-selected" : ""}`}
        style={{
          transform: `translate3d(${position.x}px, ${position.y}px, 0)`,
          width: item.width,
          height: item.height,
        }}
        onPointerDown={(event) => {
          event.stopPropagation();
          onSelect();
        }}
        onDoubleClick={(event) => {
          event.stopPropagation();
          onEnterBoard();
        }}
        onContextMenu={(event) => {
          event.preventDefault();
          event.stopPropagation();
          onSelect();
          setMenu({ x: event.clientX, y: event.clientY });
        }}
      >
        <div className="board-card" onPointerDown={startDrag}>
          <span className={`board-color-swatch color-${item.color}`} />
          {renaming ? (
            <input
              ref={renameRef}
              className="board-card-name-input"
              value={item.title}
              onPointerDown={(event) => event.stopPropagation()}
              onChange={(event) => onUpdate({ title: event.target.value })}
              onBlur={() => setRenaming(false)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === "Escape") {
                  setRenaming(false);
                }
              }}
            />
          ) : (
            <span className="board-card-name">{item.title || "Nuevo tablero"}</span>
          )}
        </div>
      </article>

      {menu ? (
        <BoardContextMenu
          x={menu.x}
          y={menu.y}
          currentColor={item.color}
          onRename={() => {
            setMenu(null);
            setRenaming(true);
          }}
          onDelete={() => {
            setMenu(null);
            onDelete();
          }}
          onColor={(color) => {
            onUpdate({ color });
            setMenu(null);
          }}
          onClose={() => setMenu(null)}
        />
      ) : null}
    </>
  );
});

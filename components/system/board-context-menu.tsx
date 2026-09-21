"use client";

import { useEffect, useRef } from "react";
import type { ItemColor } from "@/lib/workspace/types";

const BOARD_COLORS: ItemColor[] = [
  "white",
  "sand",
  "yellow",
  "blue",
  "green",
  "rose",
];

type BoardContextMenuProps = {
  x: number;
  y: number;
  currentColor: ItemColor;
  onRename: () => void;
  onDelete: () => void;
  onColor: (color: ItemColor) => void;
  onClose: () => void;
};

export function BoardContextMenu({
  x,
  y,
  currentColor,
  onRename,
  onDelete,
  onColor,
  onClose,
}: BoardContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (menuRef.current?.contains(event.target as Node)) return;
      onClose();
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  return (
    <div
      ref={menuRef}
      className="board-context-menu"
      style={{ left: x, top: y }}
      role="menu"
      onContextMenu={(event) => event.preventDefault()}
    >
      <button type="button" role="menuitem" onClick={onRename}>
        Renombrar
      </button>
      <button type="button" role="menuitem" className="danger" onClick={onDelete}>
        Eliminar
      </button>
      <div className="board-context-menu-colors" role="group" aria-label="Color">
        {BOARD_COLORS.map((color) => (
          <button
            key={color}
            type="button"
            className={`board-context-color color-${color} ${
              currentColor === color ? "is-active" : ""
            }`}
            onClick={() => onColor(color)}
            aria-label={`Color ${color}`}
            aria-pressed={currentColor === color}
          />
        ))}
      </div>
    </div>
  );
}

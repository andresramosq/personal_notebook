"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
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
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (event.button !== 0) return;
      if (menuRef.current?.contains(event.target as Node)) return;
      onClose();
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    const timer = window.setTimeout(() => {
      window.addEventListener("pointerdown", handlePointerDown);
      window.addEventListener("keydown", handleKeyDown);
    }, 0);

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [mounted, onClose]);

  if (!mounted) return null;

  return createPortal(
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
    </div>,
    document.body,
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

type CanvasContextMenuProps = {
  x: number;
  y: number;
  canGroup: boolean;
  onGroupIntoColumn: () => void;
  onDelete: () => void;
  onClose: () => void;
};

export function CanvasContextMenu({
  x,
  y,
  canGroup,
  onGroupIntoColumn,
  onDelete,
  onClose,
}: CanvasContextMenuProps) {
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
      className="board-context-menu canvas-context-menu"
      style={{ left: x, top: y }}
      role="menu"
      onContextMenu={(event) => event.preventDefault()}
    >
      {canGroup ? (
        <button type="button" role="menuitem" onClick={onGroupIntoColumn}>
          Agrupar en columna
        </button>
      ) : null}
      <button type="button" role="menuitem" className="danger" onClick={onDelete}>
        Eliminar
      </button>
    </div>,
    document.body,
  );
}

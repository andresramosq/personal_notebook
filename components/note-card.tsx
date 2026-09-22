"use client";

import { useRef, useState } from "react";
import type { Note } from "@/lib/types";

type NoteCardProps = {
  note: Note;
  zoom: number;
  selected: boolean;
  onSelect: () => void;
  onMove: (x: number, y: number) => void;
  onUpdate: (content: string) => void;
  onDelete: () => void;
};

export function NoteCard({
  note,
  zoom,
  selected,
  onSelect,
  onMove,
  onUpdate,
  onDelete,
}: NoteCardProps) {
  const [dragPosition, setDragPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const dragPositionRef = useRef<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const position = dragPosition ?? { x: note.x, y: note.y };

  const startDrag = (event: React.PointerEvent<HTMLElement>) => {
    if (event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();
    onSelect();
    setIsDragging(true);

    const start = { x: event.clientX, y: event.clientY };
    const origin = { x: note.x, y: note.y };

    const move = (moveEvent: PointerEvent) => {
      const next = {
        x: origin.x + (moveEvent.clientX - start.x) / zoom,
        y: origin.y + (moveEvent.clientY - start.y) / zoom,
      };
      dragPositionRef.current = next;
      setDragPosition(next);
    };

    const stop = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", stop);
      setIsDragging(false);
      if (dragPositionRef.current) {
        onMove(dragPositionRef.current.x, dragPositionRef.current.y);
      }
      dragPositionRef.current = null;
      setDragPosition(null);
    };

    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", stop, { once: true });
  };

  return (
    <article
      className={`note-card ${selected ? "is-selected" : ""} ${
        isDragging ? "is-dragging" : ""
      }`}
      style={{
        transform: `translate3d(${position.x}px, ${position.y}px, 0)`,
      }}
      onPointerDown={(event) => {
        event.stopPropagation();
        onSelect();
      }}
    >
      <div className="note-card-header" onPointerDown={startDrag}>
        <span>Nota</span>
        <button
          type="button"
          className="note-card-delete"
          onPointerDown={(event) => event.stopPropagation()}
          onClick={onDelete}
          aria-label="Eliminar nota"
        >
          ×
        </button>
      </div>
      <textarea
        value={note.content}
        placeholder="Empieza a escribir…"
        onPointerDown={(event) => event.stopPropagation()}
        onChange={(event) => onUpdate(event.target.value)}
      />
    </article>
  );
}

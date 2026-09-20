"use client";

import { memo, useEffect, useRef, useState } from "react";
import type { CanvasItem } from "@/lib/canvas/types";

type CanvasItemCardProps = {
  item: CanvasItem;
  zoom: number;
  selected: boolean;
  onSelect: () => void;
  onUpdate: (changes: Partial<CanvasItem>) => void;
  onDelete: () => void;
};

const TYPE_LABELS: Record<CanvasItem["type"], string> = {
  note: "Nota",
  task: "Tarea",
  text: "Texto",
  shape: "Figura",
};

export const CanvasItemCard = memo(function CanvasItemCard({
  item,
  zoom,
  selected,
  onSelect,
  onUpdate,
  onDelete,
}: CanvasItemCardProps) {
  const [position, setPosition] = useState({ x: item.x, y: item.y });
  const positionRef = useRef(position);

  useEffect(() => {
    const next = { x: item.x, y: item.y };
    positionRef.current = next;
    setPosition(next);
  }, [item.x, item.y]);

  const startDragging = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    onSelect();

    const startPointer = { x: event.clientX, y: event.clientY };
    const startPosition = positionRef.current;

    const handleMove = (moveEvent: PointerEvent) => {
      const next = {
        x: startPosition.x + (moveEvent.clientX - startPointer.x) / zoom,
        y: startPosition.y + (moveEvent.clientY - startPointer.y) / zoom,
      };

      positionRef.current = next;
      setPosition(next);
    };

    const handleUp = () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
      onUpdate(positionRef.current);
    };

    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp, { once: true });
  };

  const cardClassName = [
    "canvas-item",
    `canvas-item--${item.type}`,
    selected ? "canvas-item--selected" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <article
      className={cardClassName}
      style={{
        transform: `translate3d(${position.x}px, ${position.y}px, 0)`,
        width: item.width,
        height: item.height,
        backgroundColor: item.color,
      }}
      onPointerDown={(event) => {
        event.stopPropagation();
        onSelect();
      }}
    >
      <div className="canvas-item__header" onPointerDown={startDragging}>
        <span>{TYPE_LABELS[item.type]}</span>
        <button
          type="button"
          className="canvas-item__delete"
          aria-label={`Eliminar ${item.title}`}
          onPointerDown={(event) => event.stopPropagation()}
          onClick={onDelete}
        >
          ×
        </button>
      </div>

      <div className="canvas-item__body">
        <div className="canvas-item__title-row">
          {item.type === "task" ? (
            <input
              type="checkbox"
              checked={item.completed}
              aria-label="Marcar tarea como completada"
              onChange={(event) =>
                onUpdate({ completed: event.currentTarget.checked })
              }
            />
          ) : null}
          <input
            className={`canvas-item__title ${
              item.completed ? "canvas-item__title--completed" : ""
            }`}
            value={item.title}
            aria-label="Título"
            onChange={(event) => onUpdate({ title: event.currentTarget.value })}
          />
        </div>

        {item.type !== "shape" ? (
          <textarea
            className="canvas-item__content"
            value={item.content}
            aria-label="Contenido"
            onChange={(event) =>
              onUpdate({ content: event.currentTarget.value })
            }
          />
        ) : null}
      </div>
    </article>
  );
});

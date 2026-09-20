"use client";

import { memo, useEffect, useRef, useState } from "react";
import { Icon } from "@/components/system/icon";
import { drawingPath } from "@/lib/workspace/drawing";
import type { CanvasItem, ItemColor } from "@/lib/workspace/types";

type ObjectCardProps = {
  item: CanvasItem;
  zoom: number;
  selected: boolean;
  linking: boolean;
  nestedPreview: CanvasItem[];
  onSelect: () => void;
  onMove: (x: number, y: number) => void;
  onResize: (width: number, height: number) => void;
  onUpdate: (changes: Partial<CanvasItem>) => void;
  onDelete: () => void;
  onEnterBoard: () => void;
  onOpenDatabase: () => void;
};

const COLORS: ItemColor[] = [
  "white",
  "sand",
  "yellow",
  "blue",
  "green",
  "rose",
];

export const ObjectCard = memo(function ObjectCard({
  item,
  zoom,
  selected,
  linking,
  nestedPreview,
  onSelect,
  onMove,
  onResize,
  onUpdate,
  onDelete,
  onEnterBoard,
  onOpenDatabase,
}: ObjectCardProps) {
  const [position, setPosition] = useState({ x: item.x, y: item.y });
  const positionRef = useRef(position);

  useEffect(() => {
    const next = { x: item.x, y: item.y };
    positionRef.current = next;
    setPosition(next);
  }, [item.x, item.y]);

  const startDrag = (event: React.PointerEvent<HTMLElement>) => {
    if (event.button !== 0 || linking) return;
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
        Math.max(160, origin.width + (moveEvent.clientX - start.x) / zoom),
        Math.max(70, origin.height + (moveEvent.clientY - start.y) / zoom),
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
      className={`canvas-item item-${item.kind} color-${item.color} ${
        selected ? "is-selected" : ""
      } ${linking ? "is-linking" : ""}`}
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
        if (item.kind === "board") onEnterBoard();
        if (item.kind === "database") onOpenDatabase();
      }}
    >
      {selected && item.kind !== "drawing" ? (
        <div
          className="item-actions"
          onPointerDown={(event) => event.stopPropagation()}
        >
          <div className="item-colors">
            {COLORS.map((color) => (
              <button
                key={color}
                type="button"
                className={`color-${color} ${
                  item.color === color ? "is-active" : ""
                }`}
                onClick={() => onUpdate({ color })}
                aria-label={`Color ${color}`}
              />
            ))}
          </div>
          <button
            type="button"
            className="danger"
            onClick={onDelete}
            title="Eliminar"
          >
            <Icon name="trash" size={16} />
          </button>
        </div>
      ) : null}

      {selected && item.kind === "drawing" ? (
        <div
          className="item-actions drawing-actions"
          onPointerDown={(event) => event.stopPropagation()}
        >
          {["#292929", "#5b5bd6", "#c64f4f", "#2f8f4e"].map((color) => (
            <button
              key={color}
              type="button"
              className={`stroke-color ${item.strokeColor === color ? "is-active" : ""}`}
              style={{ background: color }}
              onClick={() => onUpdate({ strokeColor: color })}
              aria-label={`Trazo ${color}`}
            />
          ))}
        </div>
      ) : null}

      {linking ? (
        <button
          type="button"
          className="link-target-overlay"
          onPointerDown={(event) => event.stopPropagation()}
          onClick={(event) => {
            event.stopPropagation();
            onSelect();
          }}
          aria-label={`Conectar ${item.title || "elemento"}`}
        />
      ) : null}

      {item.kind !== "drawing" ? (
        <div className="item-drag-area" onPointerDown={startDrag} />
      ) : (
        <div
          className="drawing-drag-area"
          onPointerDown={(event) => {
            if (event.button !== 0 || linking) return;
            startDrag(event);
          }}
        />
      )}
      <div className={`item-content ${item.kind === "drawing" ? "drawing-content" : ""}`}>
        {item.kind === "drawing" ? (
          <svg
            className="drawing-svg"
            width={item.width}
            height={item.height}
            viewBox={`0 0 ${item.width} ${item.height}`}
          >
            <path
              d={drawingPath(item.points)}
              fill="none"
              stroke={item.strokeColor}
              strokeWidth={item.strokeWidth}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        ) : null}
        {item.kind === "text" ? (
          <textarea
            className="text-content"
            value={item.content}
            placeholder="Escribe un texto"
            onPointerDown={(event) => event.stopPropagation()}
            onChange={(event) => onUpdate({ content: event.target.value })}
          />
        ) : null}

        {item.kind === "note" ? (
          <>
            <input
              className="item-title"
              value={item.title}
              placeholder="Título"
              onPointerDown={(event) => event.stopPropagation()}
              onChange={(event) => onUpdate({ title: event.target.value })}
            />
            <textarea
              className="note-content"
              value={item.content}
              placeholder="Escribe aquí…"
              onPointerDown={(event) => event.stopPropagation()}
              onChange={(event) => onUpdate({ content: event.target.value })}
            />
          </>
        ) : null}

        {item.kind === "board" ? (
          <>
            <div className="board-header">
              <Icon name="board" size={15} />
              <input
                className="item-title"
                value={item.title}
                onPointerDown={(event) => event.stopPropagation()}
                onChange={(event) => onUpdate({ title: event.target.value })}
              />
            </div>
            <div className="board-preview">
              {nestedPreview.length ? (
                nestedPreview.map((preview) => (
                  <div
                    key={preview.id}
                    className={`preview-chip color-${preview.color}`}
                  >
                    {preview.title || preview.content || "Elemento"}
                  </div>
                ))
              ) : (
                <span className="board-empty">Doble clic para entrar</span>
              )}
            </div>
          </>
        ) : null}

        {item.kind === "link" ? (
          <>
            <div className="link-header">
              <Icon name="link" size={15} />
              <input
                className="item-title"
                value={item.title}
                onPointerDown={(event) => event.stopPropagation()}
                onChange={(event) => onUpdate({ title: event.target.value })}
              />
            </div>
            <input
              className="link-url"
              value={item.url}
              placeholder="https://"
              onPointerDown={(event) => event.stopPropagation()}
              onChange={(event) => onUpdate({ url: event.target.value })}
            />
            {item.url.startsWith("http") ? (
              <a
                className="link-open"
                href={item.url}
                target="_blank"
                rel="noreferrer"
                onPointerDown={(event) => event.stopPropagation()}
              >
                Abrir enlace
              </a>
            ) : null}
          </>
        ) : null}

        {item.kind === "image" ? (
          <>
            <input
              className="item-title"
              value={item.title}
              placeholder="Imagen"
              onPointerDown={(event) => event.stopPropagation()}
              onChange={(event) => onUpdate({ title: event.target.value })}
            />
            {item.url.startsWith("http") ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                className="image-preview"
                src={item.url}
                alt={item.title || "Imagen"}
              />
            ) : (
              <input
                className="link-url"
                value={item.url}
                placeholder="Pega la URL de la imagen"
                onPointerDown={(event) => event.stopPropagation()}
                onChange={(event) => onUpdate({ url: event.target.value })}
              />
            )}
          </>
        ) : null}

        {item.kind === "database" ? (
          <>
            <div className="database-card-header">
              <Icon name="database" size={15} />
              <input
                className="item-title"
                value={item.title}
                onPointerDown={(event) => event.stopPropagation()}
                onChange={(event) => onUpdate({ title: event.target.value })}
              />
            </div>
            <div className="database-card-preview">
              <div className="database-preview-heading">
                {item.databaseFields.slice(0, 2).map((field) => (
                  <span key={field.id}>{field.name}</span>
                ))}
              </div>
              {item.databaseRecords.slice(0, 3).map((record) => (
                <div className="database-preview-row" key={record.id}>
                  {item.databaseFields.slice(0, 2).map((field) => (
                    <span key={field.id}>
                      {formatPreviewValue(record.cells[field.id])}
                    </span>
                  ))}
                </div>
              ))}
              {!item.databaseRecords.length ? (
                <span className="database-preview-empty">
                  Doble clic para añadir registros
                </span>
              ) : null}
            </div>
            <small className="database-card-count">
              {item.databaseRecords.length} registros
            </small>
          </>
        ) : null}
      </div>

      {selected && item.kind !== "drawing" ? (
        <button
          type="button"
          className="resize-handle"
          onPointerDown={startResize}
          aria-label="Redimensionar"
        />
      ) : null}
    </article>
  );
});

function formatPreviewValue(value: string | boolean | undefined) {
  if (typeof value === "boolean") return value ? "✓" : "—";
  return value || "—";
}

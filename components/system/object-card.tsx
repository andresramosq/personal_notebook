"use client";

import { memo, useEffect, useRef, useState } from "react";
import { Icon } from "@/components/system/icon";
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
      }}
    >
      {selected ? (
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

      <div className="item-drag-area" onPointerDown={startDrag} />
      <div className="item-content">
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
      </div>

      {selected ? (
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

"use client";

import { memo, useEffect, useRef, useState, type KeyboardEvent } from "react";
import { BlockComment } from "@/components/system/block-comment";
import { BlockKanban } from "@/components/system/block-kanban";
import { BlockTable } from "@/components/system/block-table";
import { BlockTodo } from "@/components/system/block-todo";
import { Icon } from "@/components/system/icon";
import {
  getVideoEmbedUrl,
  isDisplayableImageUrl,
  isUploadedAssetUrl,
} from "@/lib/workspace/embed";
import { drawingPath } from "@/lib/workspace/drawing";
import type { CanvasItem, ItemColor } from "@/lib/workspace/types";

type ObjectCardProps = {
  item: CanvasItem;
  zoom: number;
  selected: boolean;
  nestedPreview?: CanvasItem[];
  onSelect: () => void;
  onMove: (x: number, y: number) => void;
  onResize: (width: number, height: number) => void;
  onUpdate: (changes: Partial<CanvasItem>) => void;
  onDelete: () => void;
  onEnterBoard: () => void;
  embedded?: boolean;
  onPrepareDrag?: (event: React.DragEvent<HTMLElement>) => void;
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
  nestedPreview = [],
  onSelect,
  onMove,
  onResize,
  onUpdate,
  onDelete,
  onEnterBoard,
  embedded = false,
  onPrepareDrag,
}: ObjectCardProps) {
  const noteRef = useRef<HTMLTextAreaElement>(null);
  const [position, setPosition] = useState({ x: item.x, y: item.y });
  const positionRef = useRef(position);
  const [linkPreview, setLinkPreview] = useState<{
    title: string;
    description: string;
    image: string;
  } | null>(null);

  useEffect(() => {
    if (item.kind !== "link") {
      setLinkPreview(null);
      return;
    }

    const url = item.url.trim();
    if (!/^https?:\/\//i.test(url)) {
      setLinkPreview(null);
      return;
    }

    let cancelled = false;
    const timer = window.setTimeout(() => {
      void fetch(`/api/link-preview?url=${encodeURIComponent(url)}`)
        .then((response) => (response.ok ? response.json() : null))
        .then((data) => {
          if (cancelled || !data) return;
          setLinkPreview({
            title: data.title ?? "",
            description: data.description ?? "",
            image: data.image ?? "",
          });
          if (!item.title.trim() && data.title) {
            onUpdate({ title: data.title });
          }
        })
        .catch(() => {
          if (!cancelled) setLinkPreview(null);
        });
    }, 450);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [item.kind, item.url]);

  useEffect(() => {
    const next = { x: item.x, y: item.y };
    positionRef.current = next;
    setPosition(next);
  }, [item.x, item.y]);

  const startDrag = (event: React.PointerEvent<HTMLElement>) => {
    if (embedded || event.button !== 0) return;
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
      } ${
        item.kind === "line" || item.kind === "drawing" ? "item-stroke" : ""
      } ${embedded ? "canvas-item-embedded" : ""}`}
      style={
        embedded
          ? { width: "100%", minHeight: item.height }
          : {
              transform: `translate3d(${position.x}px, ${position.y}px, 0)`,
              width: item.width,
              height: item.height,
            }
      }
      draggable={Boolean(onPrepareDrag)}
      onDragStart={onPrepareDrag}
      onPointerDown={(event) => {
        event.stopPropagation();
        onSelect();
      }}
      onDoubleClick={(event) => {
        event.stopPropagation();
        if (item.kind === "board") onEnterBoard();
      }}
    >
      {selected &&
      item.kind !== "drawing" &&
      item.kind !== "line" &&
      item.kind !== "kanban" ? (
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

      {selected && (item.kind === "drawing" || item.kind === "line") ? (
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

      {!embedded && item.kind !== "drawing" && item.kind !== "line" ? (
        <div className="item-drag-area" onPointerDown={startDrag} />
      ) : !embedded ? (
        <div
          className="drawing-drag-area"
          onPointerDown={(event) => {
            if (event.button !== 0) return;
            startDrag(event);
          }}
        />
      ) : null}
      <div
        className={`item-content ${
          item.kind === "drawing" || item.kind === "line"
            ? "drawing-content"
            : ""
        } ${item.kind === "comment" ? "comment-content" : ""}`}
      >
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
        {item.kind === "line" && item.points.length >= 2 ? (
          <svg
            className="drawing-svg line-svg"
            width={item.width}
            height={item.height}
            viewBox={`0 0 ${item.width} ${item.height}`}
          >
            <defs>
              <marker
                id={`line-arrow-${item.id}`}
                viewBox="0 0 10 10"
                refX="8"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto"
              >
                <path d="M 0 0 L 10 5 L 0 10 z" fill={item.strokeColor} />
              </marker>
            </defs>
            <line
              x1={item.points[0].x}
              y1={item.points[0].y}
              x2={item.points[1].x}
              y2={item.points[1].y}
              stroke={item.strokeColor}
              strokeWidth={item.strokeWidth}
              markerEnd={`url(#line-arrow-${item.id})`}
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
              ref={noteRef}
              className="note-content"
              value={item.content}
              placeholder="Escribe aquí…"
              onPointerDown={(event) => event.stopPropagation()}
              onChange={(event) => {
                const content = event.target.value;
                const nextHeight = Math.max(
                  160,
                  event.target.scrollHeight + 56,
                );
                onUpdate({
                  content,
                  height: nextHeight,
                });
              }}
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
                placeholder={linkPreview?.title || "Enlace"}
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
              onKeyDown={(event: KeyboardEvent<HTMLInputElement>) => {
                if (event.key === "Enter") {
                  event.currentTarget.blur();
                }
              }}
            />
            {linkPreview?.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                className="link-preview-image"
                src={linkPreview.image}
                alt=""
              />
            ) : null}
            {linkPreview?.description ? (
              <p className="link-preview-description">{linkPreview.description}</p>
            ) : null}
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
            {isDisplayableImageUrl(item.url) ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  className="image-preview"
                  src={item.url}
                  alt={item.title || "Imagen"}
                />
                <input
                  className="image-caption"
                  value={item.caption}
                  placeholder="Añade un pie de foto"
                  onPointerDown={(event) => event.stopPropagation()}
                  onChange={(event) => onUpdate({ caption: event.target.value })}
                />
              </>
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

        {item.kind === "video" ? (
          <>
            <input
              className="item-title"
              value={item.title}
              placeholder="Video"
              onPointerDown={(event) => event.stopPropagation()}
              onChange={(event) => onUpdate({ title: event.target.value })}
            />
            {getVideoEmbedUrl(item.url) ? (
              <iframe
                className="video-embed"
                src={getVideoEmbedUrl(item.url) ?? undefined}
                title={item.title || "Video"}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : isUploadedAssetUrl(item.url) ? (
              // eslint-disable-next-line jsx-a11y/media-has-caption
              <video className="video-file" src={item.url} controls />
            ) : (
              <input
                className="link-url"
                value={item.url}
                placeholder="Pega un enlace de YouTube o Vimeo"
                onPointerDown={(event) => event.stopPropagation()}
                onChange={(event) => onUpdate({ url: event.target.value })}
              />
            )}
          </>
        ) : null}

        {item.kind === "file" ? (
          <div className="file-card">
            <span className="file-card-icon">📄</span>
            <div className="file-card-meta">
              <input
                className="item-title"
                value={item.title}
                onPointerDown={(event) => event.stopPropagation()}
                onChange={(event) => onUpdate({ title: event.target.value })}
              />
              {item.url ? (
                <a
                  className="file-card-link"
                  href={item.url}
                  download={item.title || undefined}
                  onPointerDown={(event) => event.stopPropagation()}
                >
                  Descargar archivo
                </a>
              ) : null}
            </div>
          </div>
        ) : null}

        {item.kind === "todo" ? (
          <>
            <div className="todo-header">
              <Icon name="todo" size={15} />
              <input
                className="item-title"
                value={item.title}
                onPointerDown={(event) => event.stopPropagation()}
                onChange={(event) => onUpdate({ title: event.target.value })}
              />
            </div>
            <BlockTodo
              content={item.content}
              onChange={(next) => onUpdate({ content: next })}
            />
          </>
        ) : null}

        {item.kind === "kanban" ? (
          <>
            <div className="kanban-header">
              <Icon name="kanban" size={15} />
              <input
                className="item-title"
                value={item.title}
                onPointerDown={(event) => event.stopPropagation()}
                onChange={(event) => onUpdate({ title: event.target.value })}
              />
            </div>
            <BlockKanban
              content={item.content}
              onChange={(next) => onUpdate({ content: next })}
            />
          </>
        ) : null}

        {item.kind === "comment" ? (
          <>
            <div className="comment-header">
              <Icon name="comment" size={15} />
              <span>Comentario</span>
            </div>
            <BlockComment
              content={item.content}
              onChange={(next) => onUpdate({ content: next })}
            />
          </>
        ) : null}

        {item.kind === "table" ? (
          <>
            <input
              className="item-title"
              value={item.title}
              placeholder="Tabla"
              onPointerDown={(event) => event.stopPropagation()}
              onChange={(event) => onUpdate({ title: event.target.value })}
            />
            <BlockTable
              content={item.content}
              onChange={(next) => onUpdate({ content: next })}
            />
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

      {selected &&
      item.kind !== "drawing" &&
      item.kind !== "line" ? (
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

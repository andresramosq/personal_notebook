"use client";

import { memo, useEffect, useRef, useState } from "react";
import type { WorkspaceObject } from "@/lib/workspace/types";

type ObjectCardProps = {
  object: WorkspaceObject;
  zoom: number;
  selected: boolean;
  linking: boolean;
  onSelect: () => void;
  onMove: (x: number, y: number) => void;
  onResize: (width: number, height: number) => void;
  onUpdate: (changes: Partial<WorkspaceObject>) => void;
};

const STATUS_LABELS = {
  inbox: "Entrada",
  active: "Activo",
  waiting: "En espera",
  done: "Hecho",
};

export const ObjectCard = memo(function ObjectCard({
  object,
  zoom,
  selected,
  linking,
  onSelect,
  onMove,
  onResize,
  onUpdate,
}: ObjectCardProps) {
  const [position, setPosition] = useState({ x: object.x, y: object.y });
  const positionRef = useRef(position);

  useEffect(() => {
    const next = { x: object.x, y: object.y };
    positionRef.current = next;
    setPosition(next);
  }, [object.x, object.y]);

  const startDrag = (event: React.PointerEvent<HTMLElement>) => {
    if (event.button !== 0 || linking) {
      return;
    }

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

  if (object.kind === "drawing") {
    const path = object.points
      .map((point, index) => `${index ? "L" : "M"} ${point.x} ${point.y}`)
      .join(" ");

    return (
      <svg className="drawing-object" width="10000" height="10000">
        <path
          d={path}
          fill="none"
          stroke={object.strokeColor}
          strokeWidth={object.strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  const startResize = (event: React.PointerEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    const start = { x: event.clientX, y: event.clientY };
    const origin = { width: object.width, height: object.height };

    const move = (moveEvent: PointerEvent) => {
      onResize(
        Math.max(80, origin.width + (moveEvent.clientX - start.x) / zoom),
        Math.max(50, origin.height + (moveEvent.clientY - start.y) / zoom),
      );
    };
    const stop = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", stop);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", stop, { once: true });
  };

  const shape =
    object.kind === "rectangle" || object.kind === "ellipse";

  return (
    <article
      className={`object-card object-${object.kind} ${
        selected ? "is-selected" : ""
      } ${
        linking ? "is-linking" : ""
      }`}
      style={{
        transform: `translate3d(${position.x}px, ${position.y}px, 0)`,
        width: object.width,
        minHeight: object.height,
        background: object.color,
      }}
      onPointerDown={(event) => {
        event.stopPropagation();
        onSelect();
      }}
    >
      <header onPointerDown={startDrag}>
        <span className={`status-dot status-${object.status}`} />
        <span>
          {object.kind === "page"
            ? "Página"
            : object.kind === "database"
              ? "Base de datos"
              : object.kind === "note"
                ? "Nota"
                : object.kind === "text"
                  ? "Texto"
                  : shape
                    ? "Figura"
                    : STATUS_LABELS[object.status]}
        </span>
        <span className="drag-handle">⠿</span>
      </header>
      <div className="object-card-body">
        {object.kind === "database" ? (
          <>
            <input
              className="object-title-input"
              value={object.title}
              onChange={(event) => onUpdate({ title: event.target.value })}
            />
            <div className="mini-database">
              {object.databaseRows.map((row) => (
                <div key={row.id}>
                  <input
                    value={row.title}
                    onChange={(event) =>
                      onUpdate({
                        databaseRows: object.databaseRows.map((item) =>
                          item.id === row.id
                            ? { ...item, title: event.target.value }
                            : item,
                        ),
                      })
                    }
                  />
                  <span>{STATUS_LABELS[row.status]}</span>
                </div>
              ))}
              <button
                type="button"
                onClick={() =>
                  onUpdate({
                    databaseRows: [
                      ...object.databaseRows,
                      {
                        id: crypto.randomUUID(),
                        title: "Nuevo registro",
                        status: "inbox",
                        value: "",
                      },
                    ],
                  })
                }
              >
                + Registro
              </button>
            </div>
          </>
        ) : shape ? (
          <input
            className="shape-label"
            value={object.title}
            placeholder="Etiqueta"
            onChange={(event) => onUpdate({ title: event.target.value })}
          />
        ) : (
          <>
            <input
              className="object-title-input"
              value={object.title}
              onChange={(event) => onUpdate({ title: event.target.value })}
            />
            {object.kind !== "text" ? (
              <textarea
                className="object-description-input"
                value={object.description}
                placeholder={
                  object.kind === "page"
                    ? "Empieza a escribir tu documento…"
                    : "Escribe aquí…"
                }
                onChange={(event) =>
                  onUpdate({ description: event.target.value })
                }
              />
            ) : null}
            <div className="object-meta">
              {object.person ? <span>◎ {object.person}</span> : null}
              {object.endDate ? <span>◷ {object.endDate}</span> : null}
            </div>
          </>
        )}
      </div>
      <button
        type="button"
        className="resize-handle"
        onPointerDown={startResize}
        aria-label="Redimensionar"
      />
    </article>
  );
});

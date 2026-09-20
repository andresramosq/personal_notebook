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

  return (
    <article
      className={`object-card ${selected ? "is-selected" : ""} ${
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
        <span>{STATUS_LABELS[object.status]}</span>
        <span className="drag-handle">⠿</span>
      </header>
      <div className="object-card-body">
        <h3>{object.title || "Sin título"}</h3>
        {object.description ? <p>{object.description}</p> : null}
        <div className="object-meta">
          {object.person ? <span>◎ {object.person}</span> : null}
          {object.endDate ? <span>◷ {object.endDate}</span> : null}
          {object.reminder ? <span>♢ Recordatorio</span> : null}
        </div>
        {object.tags.length ? (
          <div className="object-tags">
            {object.tags.map((tag) => (
              <span key={tag}>{tag}</span>
            ))}
          </div>
        ) : null}
      </div>
    </article>
  );
});

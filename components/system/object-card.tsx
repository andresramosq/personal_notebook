"use client";

import { memo, useEffect, useRef, useState } from "react";
import { Icon } from "@/components/system/icon";
import type {
  CanvasItem,
  ChecklistEntry,
  ItemColor,
} from "@/lib/workspace/types";

type ObjectCardProps = {
  item: CanvasItem;
  zoom: number;
  selected: boolean;
  onSelect: () => void;
  onMove: (x: number, y: number) => void;
  onResize: (width: number, height: number) => void;
  onUpdate: (changes: Partial<CanvasItem>) => void;
  onDuplicate: () => void;
  onDelete: () => void;
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
  onSelect,
  onMove,
  onResize,
  onUpdate,
  onDuplicate,
  onDelete,
}: ObjectCardProps) {
  const [position, setPosition] = useState({ x: item.x, y: item.y });
  const positionRef = useRef(position);

  useEffect(() => {
    const next = { x: item.x, y: item.y };
    positionRef.current = next;
    setPosition(next);
  }, [item.x, item.y]);

  const startDrag = (event: React.PointerEvent<HTMLElement>) => {
    if (event.button !== 0) return;
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
        Math.max(180, origin.width + (moveEvent.clientX - start.x) / zoom),
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

  const updateChecklist = (entry: ChecklistEntry) => {
    onUpdate({
      checklist: item.checklist.map((candidate) =>
        candidate.id === entry.id ? entry : candidate,
      ),
    });
  };

  return (
    <article
      className={`canvas-item item-${item.kind} color-${item.color} ${
        selected ? "is-selected" : ""
      }`}
      style={{
        transform: `translate3d(${position.x}px, ${position.y}px, 0)`,
        width: item.width,
        height: item.height,
      }}
      onPointerDown={(event) => {
        event.stopPropagation();
        onSelect();
      }}
      onDoubleClick={(event) => event.stopPropagation()}
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
          <span />
          <button type="button" onClick={onDuplicate} title="Duplicar">
            <Icon name="copy" size={16} />
          </button>
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

      <div className="item-drag-area" onPointerDown={startDrag} />
      <div className="item-content">
        {item.kind === "text" ? (
          <textarea
            className="text-content"
            value={item.content}
            placeholder="Escribe algo…"
            onPointerDown={(event) => event.stopPropagation()}
            onChange={(event) => onUpdate({ content: event.target.value })}
          />
        ) : (
          <>
            <input
              className="item-title"
              value={item.title}
              placeholder={
                item.kind === "checklist" ? "Título de la lista" : "Título"
              }
              onPointerDown={(event) => event.stopPropagation()}
              onChange={(event) => onUpdate({ title: event.target.value })}
            />
            {item.kind === "note" ? (
              <textarea
                className="note-content"
                value={item.content}
                placeholder="Escribe aquí…"
                onPointerDown={(event) => event.stopPropagation()}
                onChange={(event) => onUpdate({ content: event.target.value })}
              />
            ) : (
              <div className="checklist">
                {item.checklist.map((entry) => (
                  <div className="checklist-row" key={entry.id}>
                    <button
                      type="button"
                      className={entry.checked ? "is-checked" : ""}
                      onClick={() =>
                        updateChecklist({ ...entry, checked: !entry.checked })
                      }
                      aria-label={
                        entry.checked
                          ? "Marcar como pendiente"
                          : "Marcar como completado"
                      }
                    >
                      {entry.checked ? <Icon name="check" size={13} /> : null}
                    </button>
                    <input
                      value={entry.text}
                      className={entry.checked ? "is-checked" : ""}
                      placeholder="Nueva tarea"
                      onPointerDown={(event) => event.stopPropagation()}
                      onChange={(event) =>
                        updateChecklist({ ...entry, text: event.target.value })
                      }
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          onUpdate({
                            checklist: [
                              ...item.checklist,
                              {
                                id: crypto.randomUUID(),
                                text: "",
                                checked: false,
                              },
                            ],
                          });
                        }
                      }}
                    />
                    {item.checklist.length > 1 ? (
                      <button
                        type="button"
                        className="checklist-remove"
                        onClick={() =>
                          onUpdate({
                            checklist: item.checklist.filter(
                              (candidate) => candidate.id !== entry.id,
                            ),
                          })
                        }
                        aria-label="Quitar tarea"
                      >
                        <Icon name="close" size={13} />
                      </button>
                    ) : null}
                  </div>
                ))}
                <button
                  type="button"
                  className="checklist-add"
                  onClick={() =>
                    onUpdate({
                      checklist: [
                        ...item.checklist,
                        {
                          id: crypto.randomUUID(),
                          text: "",
                          checked: false,
                        },
                      ],
                    })
                  }
                >
                  <Icon name="plus" size={14} />
                  Añadir
                </button>
              </div>
            )}
          </>
        )}
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

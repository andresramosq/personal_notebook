"use client";

import { useRef, useState } from "react";
import { ObjectCard } from "@/components/system/object-card";
import type {
  WorkspaceLink,
  WorkspaceObject,
} from "@/lib/workspace/types";

type Camera = { x: number; y: number; zoom: number };

type CanvasViewProps = {
  objects: WorkspaceObject[];
  links: WorkspaceLink[];
  selectedId: string | null;
  linkSourceId: string | null;
  onSelect: (id: string | null) => void;
  onMove: (id: string, x: number, y: number) => void;
  onCreate: (position: { x: number; y: number }) => void;
  onLinkObject: (id: string) => void;
  onDeleteLink: (id: string) => void;
};

const INITIAL_CAMERA: Camera = { x: 0, y: 0, zoom: 1 };

export function CanvasView({
  objects,
  links,
  selectedId,
  linkSourceId,
  onSelect,
  onMove,
  onCreate,
  onLinkObject,
  onDeleteLink,
}: CanvasViewProps) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const cameraRef = useRef(INITIAL_CAMERA);
  const [camera, setCamera] = useState(INITIAL_CAMERA);

  const updateCamera = (next: Camera) => {
    cameraRef.current = next;
    setCamera(next);
  };

  const startPan = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0 || event.target !== event.currentTarget) {
      return;
    }

    event.preventDefault();
    onSelect(null);
    const start = { x: event.clientX, y: event.clientY };
    const origin = cameraRef.current;

    const move = (moveEvent: PointerEvent) => {
      updateCamera({
        ...origin,
        x: origin.x + moveEvent.clientX - start.x,
        y: origin.y + moveEvent.clientY - start.y,
      });
    };

    const stop = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", stop);
    };

    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", stop, { once: true });
  };

  const handleWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    event.preventDefault();
    const viewport = viewportRef.current;
    if (!viewport) return;

    const rect = viewport.getBoundingClientRect();
    const current = cameraRef.current;
    const pointerX = event.clientX - rect.left;
    const pointerY = event.clientY - rect.top;
    const worldX = (pointerX - current.x) / current.zoom;
    const worldY = (pointerY - current.y) / current.zoom;
    const zoom = Math.min(
      2.4,
      Math.max(0.3, current.zoom * Math.exp(-event.deltaY * 0.001)),
    );

    updateCamera({
      zoom,
      x: pointerX - worldX * zoom,
      y: pointerY - worldY * zoom,
    });
  };

  const handleDoubleClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget) return;
    const rect = event.currentTarget.getBoundingClientRect();
    onCreate({
      x: (event.clientX - rect.left - camera.x) / camera.zoom - 140,
      y: (event.clientY - rect.top - camera.y) / camera.zoom - 90,
    });
  };

  const byId = new Map(objects.map((object) => [object.id, object]));

  return (
    <section
      ref={viewportRef}
      className={`canvas-view ${linkSourceId ? "is-connecting" : ""}`}
      onPointerDown={startPan}
      onWheel={handleWheel}
      onDoubleClick={handleDoubleClick}
      style={{
        backgroundPosition: `${camera.x}px ${camera.y}px`,
        backgroundSize: `${24 * camera.zoom}px ${24 * camera.zoom}px`,
      }}
    >
      <div
        className="canvas-world"
        style={{
          transform: `translate3d(${camera.x}px, ${camera.y}px, 0) scale(${camera.zoom})`,
        }}
      >
        <svg className="connection-layer" width="10000" height="10000">
          {links.map((link) => {
            const from = byId.get(link.fromId);
            const to = byId.get(link.toId);
            if (!from || !to) return null;

            return (
              <line
                key={link.id}
                x1={from.x + from.width / 2}
                y1={from.y + from.height / 2}
                x2={to.x + to.width / 2}
                y2={to.y + to.height / 2}
                onDoubleClick={(event) => {
                  event.stopPropagation();
                  onDeleteLink(link.id);
                }}
              />
            );
          })}
        </svg>
        {objects.map((object) => (
          <ObjectCard
            key={object.id}
            object={object}
            zoom={camera.zoom}
            selected={selectedId === object.id}
            linking={Boolean(linkSourceId)}
            onSelect={() =>
              linkSourceId ? onLinkObject(object.id) : onSelect(object.id)
            }
            onMove={(x, y) => onMove(object.id, x, y)}
          />
        ))}
      </div>
      {!objects.length ? (
        <div className="canvas-empty">
          <strong>Construye tu sistema</strong>
          <span>
            Crea un objeto o haz doble clic en cualquier parte del lienzo.
          </span>
        </div>
      ) : null}
      <div className="canvas-controls">
        <span>{Math.round(camera.zoom * 100)}%</span>
        <button type="button" onClick={() => updateCamera(INITIAL_CAMERA)}>
          Centrar
        </button>
      </div>
    </section>
  );
}

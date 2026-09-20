"use client";

import { useRef, useState } from "react";
import { CanvasToolbar } from "@/components/system/canvas-toolbar";
import { ObjectCard } from "@/components/system/object-card";
import type {
  CanvasTool,
  DrawingPoint,
  ObjectKind,
  WorkspaceLink,
  WorkspaceObject,
} from "@/lib/workspace/types";

type Camera = { x: number; y: number; zoom: number };

type CanvasViewProps = {
  objects: WorkspaceObject[];
  links: WorkspaceLink[];
  selectedId: string | null;
  activeTool: CanvasTool;
  onToolChange: (tool: CanvasTool) => void;
  onSelect: (id: string | null) => void;
  onMove: (id: string, x: number, y: number) => void;
  onResize: (id: string, width: number, height: number) => void;
  onUpdate: (id: string, changes: Partial<WorkspaceObject>) => void;
  onCreate: (
    position: { x: number; y: number },
    kind?: ObjectKind,
    size?: { width: number; height: number },
    points?: DrawingPoint[],
  ) => void;
  onLinkObject: (id: string) => void;
  onDeleteLink: (id: string) => void;
};

const INITIAL_CAMERA: Camera = { x: 0, y: 0, zoom: 1 };

export function CanvasView({
  objects,
  links,
  selectedId,
  activeTool,
  onToolChange,
  onSelect,
  onMove,
  onResize,
  onUpdate,
  onCreate,
  onLinkObject,
  onDeleteLink,
}: CanvasViewProps) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const cameraRef = useRef(INITIAL_CAMERA);
  const [camera, setCamera] = useState(INITIAL_CAMERA);
  const [draft, setDraft] = useState<{
    kind: "rectangle" | "ellipse";
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);
  const [drawing, setDrawing] = useState<DrawingPoint[]>([]);

  const updateCamera = (next: Camera) => {
    cameraRef.current = next;
    setCamera(next);
  };

  const startPan = (event: React.PointerEvent<HTMLDivElement>) => {
    if (
      event.button !== 0 ||
      event.target !== event.currentTarget ||
      activeTool !== "hand"
    ) {
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

  const toWorld = (clientX: number, clientY: number) => {
    const viewport = viewportRef.current;
    if (!viewport) return { x: 0, y: 0 };
    const rect = viewport.getBoundingClientRect();
    return {
      x: (clientX - rect.left - cameraRef.current.x) / cameraRef.current.zoom,
      y: (clientY - rect.top - cameraRef.current.y) / cameraRef.current.zoom,
    };
  };

  const startCreating = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0 || event.target !== event.currentTarget) return;

    if (activeTool === "select") {
      onSelect(null);
      return;
    }
    if (activeTool === "hand") {
      startPan(event);
      return;
    }
    if (activeTool === "connect") return;

    const start = toWorld(event.clientX, event.clientY);

    if (activeTool === "draw") {
      const points = [start];
      setDrawing(points);
      const move = (moveEvent: PointerEvent) => {
        points.push(toWorld(moveEvent.clientX, moveEvent.clientY));
        setDrawing([...points]);
      };
      const stop = () => {
        window.removeEventListener("pointermove", move);
        window.removeEventListener("pointerup", stop);
        if (points.length > 1) {
          onCreate({ x: 0, y: 0 }, "drawing", undefined, points);
        }
        setDrawing([]);
      };
      window.addEventListener("pointermove", move);
      window.addEventListener("pointerup", stop, { once: true });
      return;
    }

    if (activeTool === "rectangle" || activeTool === "ellipse") {
      const kind = activeTool;
      const move = (moveEvent: PointerEvent) => {
        const current = toWorld(moveEvent.clientX, moveEvent.clientY);
        setDraft({
          kind,
          x: Math.min(start.x, current.x),
          y: Math.min(start.y, current.y),
          width: Math.max(20, Math.abs(current.x - start.x)),
          height: Math.max(20, Math.abs(current.y - start.y)),
        });
      };
      const stop = (upEvent: PointerEvent) => {
        window.removeEventListener("pointermove", move);
        window.removeEventListener("pointerup", stop);
        const end = toWorld(upEvent.clientX, upEvent.clientY);
        onCreate(
          { x: Math.min(start.x, end.x), y: Math.min(start.y, end.y) },
          kind,
          {
            width: Math.max(80, Math.abs(end.x - start.x)),
            height: Math.max(50, Math.abs(end.y - start.y)),
          },
        );
        setDraft(null);
        onToolChange("select");
      };
      window.addEventListener("pointermove", move);
      window.addEventListener("pointerup", stop, { once: true });
      return;
    }

    const kind = activeTool as ObjectKind;
    onCreate({ x: start.x - 120, y: start.y - 70 }, kind);
    onToolChange("select");
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
    }, "card");
  };

  const byId = new Map(objects.map((object) => [object.id, object]));

  return (
    <section
      ref={viewportRef}
      className={`canvas-view ${activeTool === "connect" ? "is-connecting" : ""}`}
      onPointerDown={startCreating}
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
        {drawing.length > 1 ? (
          <svg className="drawing-preview" width="10000" height="10000">
            <path
              d={drawing
                .map(
                  (point, index) =>
                    `${index ? "L" : "M"} ${point.x} ${point.y}`,
                )
                .join(" ")}
            />
          </svg>
        ) : null}
        {draft ? (
          <div
            className={`shape-draft object-${draft.kind}`}
            style={{
              transform: `translate(${draft.x}px, ${draft.y}px)`,
              width: draft.width,
              height: draft.height,
            }}
          />
        ) : null}
        {objects.map((object) => (
          <ObjectCard
            key={object.id}
            object={object}
            zoom={camera.zoom}
            selected={selectedId === object.id}
            linking={activeTool === "connect"}
            onSelect={() =>
              activeTool === "connect"
                ? onLinkObject(object.id)
                : onSelect(object.id)
            }
            onMove={(x, y) => onMove(object.id, x, y)}
            onResize={(width, height) =>
              onResize(object.id, width, height)
            }
            onUpdate={(changes) => onUpdate(object.id, changes)}
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
      <CanvasToolbar activeTool={activeTool} onChange={onToolChange} />
    </section>
  );
}

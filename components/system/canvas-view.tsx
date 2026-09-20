"use client";

import { useRef, useState } from "react";
import { ObjectCard } from "@/components/system/object-card";
import type {
  CanvasCamera,
  CanvasItem,
  CanvasLink,
  CanvasMode,
  ItemKind,
} from "@/lib/workspace/types";

type CanvasViewProps = {
  items: CanvasItem[];
  links: CanvasLink[];
  camera: CanvasCamera;
  selectedId: string | null;
  linkSourceId: string | null;
  mode: CanvasMode;
  onModeChange: (mode: CanvasMode) => void;
  onCameraChange: (camera: CanvasCamera) => void;
  onSelect: (id: string | null) => void;
  onLink: (targetId: string) => void;
  onDeleteLink: (linkId: string) => void;
  onCreate: (kind: ItemKind, position: { x: number; y: number }) => string;
  onUpdate: (id: string, changes: Partial<CanvasItem>) => void;
  onDelete: (id: string) => void;
  onEnterBoard: (item: CanvasItem) => void;
  getNestedPreview: (canvasId: string) => CanvasItem[];
};

const DEFAULT_CAMERA: CanvasCamera = { x: 0, y: 0, zoom: 1 };
const ITEM_KINDS: ItemKind[] = ["note", "text", "image", "link", "board"];

export function CanvasView({
  items,
  links,
  camera,
  selectedId,
  linkSourceId,
  mode,
  onModeChange,
  onCameraChange,
  onSelect,
  onLink,
  onDeleteLink,
  onCreate,
  onUpdate,
  onDelete,
  onEnterBoard,
  getNestedPreview,
}: CanvasViewProps) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const cameraRef = useRef(camera);
  const [liveCamera, setLiveCamera] = useState(camera);

  const setCamera = (next: CanvasCamera, persist = true) => {
    cameraRef.current = next;
    setLiveCamera(next);
    if (persist) onCameraChange(next);
  };

  const toWorld = (clientX: number, clientY: number) => {
    const rect = viewportRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return {
      x: (clientX - rect.left - cameraRef.current.x) / cameraRef.current.zoom,
      y: (clientY - rect.top - cameraRef.current.y) / cameraRef.current.zoom,
    };
  };

  const startPan = (event: React.PointerEvent<HTMLElement>) => {
    if (mode !== "hand" && event.button !== 1) return;
    event.preventDefault();
    onSelect(null);

    const start = { x: event.clientX, y: event.clientY };
    const origin = cameraRef.current;
    const move = (moveEvent: PointerEvent) => {
      setCamera(
        {
          ...origin,
          x: origin.x + moveEvent.clientX - start.x,
          y: origin.y + moveEvent.clientY - start.y,
        },
        false,
      );
    };
    const stop = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", stop);
      onCameraChange(cameraRef.current);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", stop, { once: true });
  };

  const handleWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    event.preventDefault();
    const rect = viewportRef.current?.getBoundingClientRect();
    if (!rect) return;

    if (event.ctrlKey || event.metaKey) {
      const current = cameraRef.current;
      const pointerX = event.clientX - rect.left;
      const pointerY = event.clientY - rect.top;
      const worldX = (pointerX - current.x) / current.zoom;
      const worldY = (pointerY - current.y) / current.zoom;
      const zoom = Math.min(
        2,
        Math.max(0.35, current.zoom * Math.exp(-event.deltaY * 0.008)),
      );
      setCamera({
        zoom,
        x: pointerX - worldX * zoom,
        y: pointerY - worldY * zoom,
      });
      return;
    }

    setCamera({
      ...cameraRef.current,
      x: cameraRef.current.x - event.deltaX,
      y: cameraRef.current.y - event.deltaY,
    });
  };

  const zoomAtCenter = (factor: number) => {
    const rect = viewportRef.current?.getBoundingClientRect();
    if (!rect) return;
    const current = cameraRef.current;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const worldX = (centerX - current.x) / current.zoom;
    const worldY = (centerY - current.y) / current.zoom;
    const zoom = Math.min(2, Math.max(0.35, current.zoom * factor));
    setCamera({
      zoom,
      x: centerX - worldX * zoom,
      y: centerY - worldY * zoom,
    });
  };

  const handleItemSelect = (item: CanvasItem) => {
    if (mode === "connect") {
      onLink(item.id);
      return;
    }
    onSelect(item.id);
  };

  const byId = new Map(items.map((item) => [item.id, item]));

  return (
    <section
      ref={viewportRef}
      className={`canvas-view mode-${mode}`}
      onPointerDown={(event) => {
        if (mode === "hand" || event.button === 1) {
          startPan(event);
        } else if (event.target === event.currentTarget) {
          onSelect(null);
        }
      }}
      onDoubleClick={(event) => {
        if (mode !== "select" || event.target !== event.currentTarget) return;
        const position = toWorld(event.clientX, event.clientY);
        const id = onCreate("note", {
          x: position.x - 140,
          y: position.y - 100,
        });
        onSelect(id);
      }}
      onWheel={handleWheel}
      onDragOver={(event) => {
        if (
          event.dataTransfer.types.includes("application/x-libreta-item") ||
          event.dataTransfer.types.includes("text/plain")
        ) {
          event.preventDefault();
          event.dataTransfer.dropEffect = "copy";
        }
      }}
      onDrop={(event) => {
        const kind = (event.dataTransfer.getData(
          "application/x-libreta-item",
        ) || event.dataTransfer.getData("text/plain")) as ItemKind;
        if (!ITEM_KINDS.includes(kind)) return;
        event.preventDefault();
        const position = toWorld(event.clientX, event.clientY);
        const id = onCreate(kind, {
          x: position.x - 130,
          y: position.y - 80,
        });
        onSelect(id);
        onModeChange("select");
      }}
      style={{
        backgroundPosition: `${liveCamera.x}px ${liveCamera.y}px`,
        backgroundSize: `${24 * liveCamera.zoom}px ${24 * liveCamera.zoom}px`,
      }}
    >
      <div
        className="canvas-world"
        style={{
          transform: `translate3d(${liveCamera.x}px, ${liveCamera.y}px, 0) scale(${liveCamera.zoom})`,
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

        {items.map((item) => (
          <ObjectCard
            key={item.id}
            item={item}
            zoom={liveCamera.zoom}
            selected={selectedId === item.id}
            linking={mode === "connect"}
            nestedPreview={
              item.kind === "board" && item.nestedCanvasId
                ? getNestedPreview(item.nestedCanvasId)
                : []
            }
            onSelect={() => handleItemSelect(item)}
            onMove={(x, y) => onUpdate(item.id, { x, y })}
            onResize={(width, height) => onUpdate(item.id, { width, height })}
            onUpdate={(changes) => onUpdate(item.id, changes)}
            onDelete={() => {
              onDelete(item.id);
              onSelect(null);
            }}
            onEnterBoard={() => onEnterBoard(item)}
          />
        ))}
      </div>

      {!items.length ? (
        <div className="canvas-empty">
          <strong>Este lienzo está vacío</strong>
          <span>Arrastra un elemento desde la barra lateral.</span>
        </div>
      ) : null}

      <div className="canvas-tools">
        <button
          type="button"
          className={mode === "select" ? "is-active" : ""}
          onClick={() => onModeChange("select")}
          title="Seleccionar"
        >
          ↖
        </button>
        <button
          type="button"
          className={mode === "hand" ? "is-active" : ""}
          onClick={() => onModeChange("hand")}
          title="Mover lienzo"
        >
          ✋
        </button>
      </div>

      <div className="canvas-controls">
        <button type="button" onClick={() => zoomAtCenter(0.85)} aria-label="Alejar">
          −
        </button>
        <button
          type="button"
          className="zoom-value"
          onClick={() => setCamera(DEFAULT_CAMERA)}
          title="Restablecer vista"
        >
          {Math.round(liveCamera.zoom * 100)}%
        </button>
        <button type="button" onClick={() => zoomAtCenter(1.15)} aria-label="Acercar">
          +
        </button>
      </div>

      {mode === "connect" ? (
        <div className="connect-hint">
          {linkSourceId
            ? "Haz clic en el segundo elemento"
            : "Haz clic en el primer elemento"}
        </div>
      ) : null}
    </section>
  );
}

"use client";

import { useRef, useState } from "react";
import { CanvasPalette } from "@/components/system/canvas-palette";
import { CanvasSelectionBar } from "@/components/system/canvas-selection-bar";
import { ObjectCard } from "@/components/system/object-card";
import type {
  CanvasCamera,
  CanvasItem,
  CanvasMode,
  ItemKind,
} from "@/lib/workspace/types";

type CanvasViewProps = {
  items: CanvasItem[];
  camera: CanvasCamera;
  selectedId: string | null;
  mode: CanvasMode;
  onModeChange: (mode: CanvasMode) => void;
  onCameraChange: (camera: CanvasCamera) => void;
  onSelect: (id: string | null) => void;
  onCreate: (kind: ItemKind, position: { x: number; y: number }) => string;
  onUpdate: (id: string, changes: Partial<CanvasItem>) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => string;
  onEnterBoard: (item: CanvasItem) => void;
  getNestedPreview: (canvasId: string) => CanvasItem[];
};

const DEFAULT_CAMERA: CanvasCamera = { x: 0, y: 0, zoom: 1 };

export function CanvasView({
  items,
  camera,
  selectedId,
  mode,
  onModeChange,
  onCameraChange,
  onSelect,
  onCreate,
  onUpdate,
  onDelete,
  onDuplicate,
  onEnterBoard,
  getNestedPreview,
}: CanvasViewProps) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const cameraRef = useRef(camera);
  const [liveCamera, setLiveCamera] = useState(camera);

  const boardItems = items.filter((item) => item.kind === "board");
  const selectedItem = boardItems.find((item) => item.id === selectedId);

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

  const addBoardAtCenter = () => {
    const rect = viewportRef.current?.getBoundingClientRect();
    if (!rect) return;
    const center = toWorld(
      rect.left + rect.width / 2,
      rect.top + rect.height / 2,
    );
    const id = onCreate("board", { x: center.x - 130, y: center.y - 90 });
    onSelect(id);
    onModeChange("select");
  };

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
        if (kind !== "board") return;
        event.preventDefault();
        const position = toWorld(event.clientX, event.clientY);
        const id = onCreate("board", {
          x: position.x - 130,
          y: position.y - 90,
        });
        onSelect(id);
        onModeChange("select");
      }}
      style={{
        backgroundPosition: `${liveCamera.x}px ${liveCamera.y}px`,
        backgroundSize: `${24 * liveCamera.zoom}px ${24 * liveCamera.zoom}px`,
      }}
    >
      <CanvasPalette
        mode={mode}
        onModeChange={onModeChange}
        onAddBoard={addBoardAtCenter}
      />

      <div
        className="canvas-world"
        style={{
          transform: `translate3d(${liveCamera.x}px, ${liveCamera.y}px, 0) scale(${liveCamera.zoom})`,
        }}
      >
        {boardItems.map((item) => (
          <ObjectCard
            key={item.id}
            item={item}
            zoom={liveCamera.zoom}
            selected={selectedId === item.id}
            linking={false}
            nestedPreview={
              item.nestedCanvasId
                ? getNestedPreview(item.nestedCanvasId)
                : []
            }
            onSelect={() => onSelect(item.id)}
            onMove={(x, y) => onUpdate(item.id, { x, y })}
            onResize={(width, height) => onUpdate(item.id, { width, height })}
            onUpdate={(changes) => onUpdate(item.id, changes)}
            onDelete={() => {
              onDelete(item.id);
              onSelect(null);
            }}
            onEnterBoard={() => onEnterBoard(item)}
            onOpenDatabase={() => undefined}
          />
        ))}
      </div>

      {!boardItems.length ? (
        <div className="canvas-empty">
          <strong>Tu tablero está vacío</strong>
          <span>Pulsa Tablero en la barra o arrástralo al lienzo.</span>
        </div>
      ) : null}

      {selectedItem ? (
        <div
          className="selection-bar-anchor"
          style={{
            left: selectedItem.x * liveCamera.zoom + liveCamera.x + 92,
            top: selectedItem.y * liveCamera.zoom + liveCamera.y - 44,
          }}
        >
          <CanvasSelectionBar
            onDuplicate={() => onDuplicate(selectedItem.id)}
            onDelete={() => {
              onDelete(selectedItem.id);
              onSelect(null);
            }}
          />
        </div>
      ) : null}

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
    </section>
  );
}

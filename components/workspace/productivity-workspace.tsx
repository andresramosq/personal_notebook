"use client";

import { useEffect, useRef, useState } from "react";
import { CanvasItemCard } from "@/components/workspace/canvas-item-card";
import { CanvasToolbar } from "@/components/workspace/canvas-toolbar";
import { useCanvasItems } from "@/hooks/use-canvas-items";
import type { CanvasItemType } from "@/lib/canvas/types";

const MIN_ZOOM = 0.35;
const MAX_ZOOM = 2.25;

type Camera = {
  x: number;
  y: number;
  zoom: number;
};

const INITIAL_CAMERA: Camera = {
  x: 0,
  y: 0,
  zoom: 1,
};

export function ProductivityWorkspace() {
  const viewportRef = useRef<HTMLDivElement>(null);
  const cameraRef = useRef(INITIAL_CAMERA);
  const [camera, setCamera] = useState(INITIAL_CAMERA);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { items, isReady, createItem, updateItem, deleteItem } =
    useCanvasItems();

  const updateCamera = (next: Camera) => {
    cameraRef.current = next;
    setCamera(next);
  };

  const resetView = () => updateCamera(INITIAL_CAMERA);

  const createAtViewportCenter = (type: CanvasItemType) => {
    const viewport = viewportRef.current;

    if (!viewport) {
      return;
    }

    const rect = viewport.getBoundingClientRect();
    const { x, y, zoom } = cameraRef.current;
    const worldX = (rect.width / 2 - x) / zoom;
    const worldY = (rect.height / 2 - y) / zoom;
    const offset = (items.length % 6) * 24;
    const id = createItem(
      type,
      worldX - 130 + offset,
      worldY - 90 + offset,
    );
    setSelectedId(id);
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;

      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      if ((event.key === "Delete" || event.key === "Backspace") && selectedId) {
        deleteItem(selectedId);
        setSelectedId(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [deleteItem, selectedId]);

  const startPanning = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0 || event.target !== event.currentTarget) {
      return;
    }

    event.preventDefault();
    setSelectedId(null);

    const startPointer = { x: event.clientX, y: event.clientY };
    const startCamera = cameraRef.current;

    const handleMove = (moveEvent: PointerEvent) => {
      updateCamera({
        ...startCamera,
        x: startCamera.x + moveEvent.clientX - startPointer.x,
        y: startCamera.y + moveEvent.clientY - startPointer.y,
      });
    };

    const handleUp = () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
    };

    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp, { once: true });
  };

  const handleWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    event.preventDefault();

    const viewport = viewportRef.current;

    if (!viewport) {
      return;
    }

    const rect = viewport.getBoundingClientRect();
    const current = cameraRef.current;
    const pointerX = event.clientX - rect.left;
    const pointerY = event.clientY - rect.top;
    const worldX = (pointerX - current.x) / current.zoom;
    const worldY = (pointerY - current.y) / current.zoom;
    const factor = Math.exp(-event.deltaY * 0.001);
    const zoom = Math.min(
      MAX_ZOOM,
      Math.max(MIN_ZOOM, current.zoom * factor),
    );

    updateCamera({
      zoom,
      x: pointerX - worldX * zoom,
      y: pointerY - worldY * zoom,
    });
  };

  return (
    <main className="workspace">
      <CanvasToolbar
        zoom={camera.zoom}
        onCreate={createAtViewportCenter}
        onResetView={resetView}
      />

      <header className="workspace-header">
        <div>
          <p className="workspace-header__eyebrow">Espacio personal</p>
          <h1>Mi lienzo</h1>
        </div>
        <p className="workspace-header__hint">
          Arrastra el fondo para moverte · Rueda para acercar
        </p>
      </header>

      <div
        ref={viewportRef}
        className="workspace-viewport"
        onPointerDown={startPanning}
        onWheel={handleWheel}
        style={{
          backgroundPosition: `${camera.x}px ${camera.y}px`,
          backgroundSize: `${24 * camera.zoom}px ${24 * camera.zoom}px`,
        }}
      >
        <div
          className="workspace-surface"
          style={{
            transform: `translate3d(${camera.x}px, ${camera.y}px, 0) scale(${camera.zoom})`,
          }}
        >
          {isReady
            ? items.map((item) => (
                <CanvasItemCard
                  key={item.id}
                  item={item}
                  zoom={camera.zoom}
                  selected={selectedId === item.id}
                  onSelect={() => setSelectedId(item.id)}
                  onUpdate={(changes) => updateItem(item.id, changes)}
                  onDelete={() => {
                    deleteItem(item.id);
                    setSelectedId((current) =>
                      current === item.id ? null : current,
                    );
                  }}
                />
              ))
            : null}
        </div>

        {isReady && items.length === 0 ? (
          <div className="workspace-empty">
            <p>Tu espacio está vacío</p>
            <span>Crea una nota, tarea, texto o figura desde la izquierda.</span>
          </div>
        ) : null}
      </div>
    </main>
  );
}

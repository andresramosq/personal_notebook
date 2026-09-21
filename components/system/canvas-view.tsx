"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { BoardCard } from "@/components/system/board-card";
import { ColumnCard } from "@/components/system/column-card";
import { CanvasPalette } from "@/components/system/canvas-palette";
import { CanvasSelectionBar } from "@/components/system/canvas-selection-bar";
import { ObjectCard } from "@/components/system/object-card";
import { uploadBoardFile } from "@/lib/workspace/client-upload";
import { findColumnDrop } from "@/lib/workspace/column-drop";
import { drawingPath } from "@/lib/workspace/drawing";
import type {
  CanvasCamera,
  CanvasItem,
  CanvasMode,
  DrawingPoint,
  ItemKind,
} from "@/lib/workspace/types";

type CanvasViewProps = {
  items: CanvasItem[];
  camera: CanvasCamera;
  selectedId: string | null;
  mode: CanvasMode;
  placementKind: ItemKind | null;
  onModeChange: (mode: CanvasMode) => void;
  onPlacementKind: (kind: ItemKind | null) => void;
  onCameraChange: (camera: CanvasCamera) => void;
  onSelect: (id: string | null) => void;
  onCreate: (kind: ItemKind, position: { x: number; y: number }) => string;
  onCreateUploaded: (
    asset: Awaited<ReturnType<typeof uploadBoardFile>>,
    position: { x: number; y: number },
  ) => string;
  onCreateDrawing: (points: DrawingPoint[]) => string;
  trashCount: number;
  onOpenTrash: () => void;
  onUpdate: (id: string, changes: Partial<CanvasItem>) => void;
  onMoveItemToColumn: (
    itemId: string,
    columnId: string,
    targetIndex: number,
  ) => void;
  onMoveItemToCanvas: (
    itemId: string,
    position: { x: number; y: number },
  ) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => string;
  onEnterBoard: (item: CanvasItem) => void;
};

const DEFAULT_CAMERA: CanvasCamera = { x: 0, y: 0, zoom: 1 };
const PLACE_OFFSET = { x: 130, y: 80 };

export function CanvasView({
  items,
  camera,
  selectedId,
  mode,
  placementKind,
  onModeChange,
  onPlacementKind,
  onCameraChange,
  onSelect,
  onCreate,
  onCreateUploaded,
  onCreateDrawing,
  trashCount,
  onOpenTrash,
  onUpdate,
  onMoveItemToColumn,
  onMoveItemToCanvas,
  onDelete,
  onDuplicate,
  onEnterBoard,
}: CanvasViewProps) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const cameraRef = useRef(camera);
  const [liveCamera, setLiveCamera] = useState(camera);
  const [draftPoints, setDraftPoints] = useState<DrawingPoint[]>([]);
  const draftPointsRef = useRef<DrawingPoint[]>([]);
  const [ghost, setGhost] = useState<{ x: number; y: number } | null>(null);
  const [columnDropHint, setColumnDropHint] = useState<{
    columnId: string;
    index: number;
  } | null>(null);

  useEffect(() => {
    cameraRef.current = camera;
    setLiveCamera(camera);
  }, [camera]);

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

  const canvasItems = items.filter((item) => !item.inUnsorted);
  const columns = canvasItems.filter((item) => item.kind === "column");
  const rootItems = canvasItems.filter(
    (item) => !item.parentColumnId && item.kind !== "column",
  );
  const selectedItem = selectedId
    ? canvasItems.find((item) => item.id === selectedId)
    : undefined;

  const updateDropHint = useCallback((clientX: number, clientY: number) => {
    setColumnDropHint(findColumnDrop(clientX, clientY));
  }, []);

  const clearDropHint = useCallback(() => {
    setColumnDropHint(null);
  }, []);

  const handleItemDragFinish = useCallback(
    (
      itemId: string,
      clientX: number,
      clientY: number,
      draftPosition?: { x: number; y: number },
    ) => {
      const drop = findColumnDrop(clientX, clientY);
      clearDropHint();

      if (drop) {
        onMoveItemToColumn(itemId, drop.columnId, drop.index);
        onSelect(itemId);
        return true;
      }

      const item = canvasItems.find((entry) => entry.id === itemId);
      if (item?.parentColumnId) {
        const position = toWorld(clientX, clientY);
        onMoveItemToCanvas(itemId, {
          x: position.x - PLACE_OFFSET.x,
          y: position.y - PLACE_OFFSET.y,
        });
        onSelect(itemId);
        return true;
      }

      return false;
    },
    [canvasItems, clearDropHint, onMoveItemToCanvas, onMoveItemToColumn, onSelect],
  );

  const placeNewItem = (clientX: number, clientY: number, kind: ItemKind) => {
    const drop = findColumnDrop(clientX, clientY);
    clearDropHint();

    if (drop && kind !== "column") {
      const id = onCreate(kind, { x: 0, y: 0 });
      onMoveItemToColumn(id, drop.columnId, drop.index);
      onSelect(id);
    } else {
      const position = toWorld(clientX, clientY);
      const id = onCreate(kind, {
        x: position.x - PLACE_OFFSET.x,
        y: position.y - PLACE_OFFSET.y,
      });
      onSelect(id);
    }

    onPlacementKind(null);
    onModeChange("select");
    setGhost(null);
  };

  useEffect(() => {
    if (!placementKind) {
      setGhost(null);
      clearDropHint();
      return;
    }

    const move = (event: PointerEvent) => {
      setGhost({ x: event.clientX, y: event.clientY });
      updateDropHint(event.clientX, event.clientY);
    };

    const place = (event: PointerEvent) => {
      const target = event.target as HTMLElement;
      if (target.closest(".canvas-palette")) return;
      if (
        target.closest(".canvas-item") &&
        !target.closest("[data-column-body]")
      ) {
        return;
      }
      if (!viewportRef.current?.contains(target)) return;
      placeNewItem(event.clientX, event.clientY, placementKind);
    };

    window.addEventListener("pointermove", move);
    window.addEventListener("pointerdown", place);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerdown", place);
    };
  }, [placementKind, clearDropHint, updateDropHint]);

  const startPan = (event: React.PointerEvent<HTMLElement>) => {
    if (event.button !== 1) return;
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

  const startStroke = (event: React.PointerEvent<HTMLElement>) => {
    if (mode !== "draw" || event.button !== 0) return;
    if (event.target !== event.currentTarget) return;

    event.preventDefault();
    onSelect(null);
    onPlacementKind(null);

    const start = toWorld(event.clientX, event.clientY);
    const nextPoints = [start];
    draftPointsRef.current = nextPoints;
    setDraftPoints(nextPoints);

    const move = (moveEvent: PointerEvent) => {
      const point = toWorld(moveEvent.clientX, moveEvent.clientY);
      const last = draftPointsRef.current.at(-1);
      if (
        last &&
        Math.hypot(point.x - last.x, point.y - last.y) <
          2 / cameraRef.current.zoom
      ) {
        return;
      }
      const updated = [...draftPointsRef.current, point];
      draftPointsRef.current = updated;
      setDraftPoints(updated);
    };

    const stop = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", stop);
      const points = draftPointsRef.current;
      draftPointsRef.current = [];
      setDraftPoints([]);
      if (points.length >= 2) {
        const id = onCreateDrawing(points);
        onSelect(id);
      }
      onModeChange("select");
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

  const importFiles = async (
    files: FileList,
    origin: { x: number; y: number },
    columnDrop?: { columnId: string; index: number },
  ) => {
    let offset = 0;
    for (const file of Array.from(files)) {
      try {
        const asset = await uploadBoardFile(file);
        const id = onCreateUploaded(asset, {
          x: origin.x + offset,
          y: origin.y + offset,
        });
        if (columnDrop) {
          onMoveItemToColumn(id, columnDrop.columnId, columnDrop.index + offset);
        }
        onSelect(id);
        offset += 1;
        onModeChange("select");
        onPlacementKind(null);
      } catch (error) {
        window.alert(
          error instanceof Error
            ? error.message
            : "No se pudo subir el archivo",
        );
      }
    }
  };

  return (
    <section
      ref={viewportRef}
      className={`canvas-view mode-${mode}${placementKind ? " mode-place" : ""}`}
      onPointerDown={(event) => {
        if (mode === "draw") {
          startStroke(event);
          return;
        }
        if (event.button === 1) {
          startPan(event);
        } else if (event.target === event.currentTarget) {
          onSelect(null);
        }
      }}
      onDoubleClick={(event) => {
        if (mode !== "select" && mode !== "draw") return;
        if (event.target !== event.currentTarget) return;
        placeNewItem(event.clientX, event.clientY, "note");
      }}
      onWheel={handleWheel}
      onDragOver={(event) => {
        if (event.dataTransfer.types.includes("Files")) {
          event.preventDefault();
          event.dataTransfer.dropEffect = "copy";
          updateDropHint(event.clientX, event.clientY);
        }
      }}
      onDragLeave={() => clearDropHint()}
      onDrop={(event) => {
        event.preventDefault();
        onPlacementKind(null);
        clearDropHint();
        const position = toWorld(event.clientX, event.clientY);
        const columnDrop = findColumnDrop(event.clientX, event.clientY);

        if (event.dataTransfer.files.length > 0) {
          void importFiles(
            event.dataTransfer.files,
            {
              x: position.x - PLACE_OFFSET.x,
              y: position.y - PLACE_OFFSET.y,
            },
            columnDrop ?? undefined,
          );
        }
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
          {draftPoints.length > 1 ? (
            <path
              className="drawing-draft"
              d={drawingPath(draftPoints)}
              fill="none"
              stroke="#292929"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ) : null}
        </svg>

        {rootItems.map((item) =>
          item.kind === "board" ? (
            <BoardCard
              key={item.id}
              item={item}
              zoom={liveCamera.zoom}
              selected={selectedId === item.id}
              onSelect={() => onSelect(item.id)}
              onMove={(x, y) => onUpdate(item.id, { x, y })}
              onUpdate={(changes) => onUpdate(item.id, changes)}
              onDelete={() => {
                onDelete(item.id);
                onSelect(null);
              }}
              onEnterBoard={() => onEnterBoard(item)}
            />
          ) : (
            <ObjectCard
              key={item.id}
              item={item}
              zoom={liveCamera.zoom}
              selected={selectedId === item.id}
              onSelect={() => onSelect(item.id)}
              onMove={(x, y) => onUpdate(item.id, { x, y })}
              onResize={(width, height) => onUpdate(item.id, { width, height })}
              onUpdate={(changes) => onUpdate(item.id, changes)}
              onDelete={() => {
                onDelete(item.id);
                onSelect(null);
              }}
              onEnterBoard={() => onEnterBoard(item)}
              onDragMove={updateDropHint}
              onDragFinish={(clientX, clientY, draftPosition) =>
                handleItemDragFinish(item.id, clientX, clientY, draftPosition)
              }
            />
          ),
        )}

        {columns.map((column) => (
          <ColumnCard
            key={column.id}
            item={column}
            children={canvasItems.filter(
              (entry) => entry.parentColumnId === column.id,
            )}
            zoom={liveCamera.zoom}
            selectedId={selectedId}
            dropHint={
              columnDropHint?.columnId === column.id
                ? columnDropHint.index
                : null
            }
            onSelect={() => onSelect(column.id)}
            onMove={(x, y) => onUpdate(column.id, { x, y })}
            onResize={(width, height) =>
              onUpdate(column.id, { width, height })
            }
            onUpdate={(changes) => onUpdate(column.id, changes)}
            onDelete={() => {
              onDelete(column.id);
              onSelect(null);
            }}
            onChildUpdate={(id, changes) => onUpdate(id, changes)}
            onChildDelete={(id) => {
              onDelete(id);
              onSelect(null);
            }}
            onChildSelect={(id) => onSelect(id)}
            onItemDragFinish={handleItemDragFinish}
            onEnterBoard={onEnterBoard}
          />
        ))}
      </div>

      <CanvasPalette
        mode={mode}
        placementKind={placementKind}
        trashCount={trashCount}
        onModeChange={onModeChange}
        onPlacementKind={onPlacementKind}
        onOpenTrash={onOpenTrash}
        onUploadFiles={(files) => {
          const rect = viewportRef.current?.getBoundingClientRect();
          if (!rect) return;
          const center = toWorld(
            rect.left + rect.width / 2,
            rect.top + rect.height / 2,
          );
          void importFiles(files, {
            x: center.x - PLACE_OFFSET.x,
            y: center.y - PLACE_OFFSET.y,
          });
        }}
      />

      {selectedItem && !selectedItem.parentColumnId ? (
        <div
          className="selection-bar-anchor"
          style={{
            left: selectedItem.x * liveCamera.zoom + liveCamera.x + 12,
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

      {placementKind ? (
        <div className="connect-hint">
          Clic en el tablero o columna para colocar
        </div>
      ) : null}

      {mode === "draw" ? (
        <div className="connect-hint">Arrastra sobre el tablero para dibujar</div>
      ) : null}

      {ghost && placementKind ? (
        <div
          className="placement-ghost"
          style={{ left: ghost.x + 12, top: ghost.y + 12 }}
        >
          {placementKind}
        </div>
      ) : null}
    </section>
  );
}

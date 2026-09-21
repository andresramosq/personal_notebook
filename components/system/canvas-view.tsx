"use client";

import { useRef, useState } from "react";
import { BoardCard } from "@/components/system/board-card";
import { ColumnCard } from "@/components/system/column-card";
import { CanvasPalette } from "@/components/system/canvas-palette";
import { CanvasSelectionBar } from "@/components/system/canvas-selection-bar";
import { Icon } from "@/components/system/icon";
import { ObjectCard } from "@/components/system/object-card";
import { uploadBoardFile } from "@/lib/workspace/client-upload";
import { drawingPath, linkCurvePath } from "@/lib/workspace/drawing";
import type {
  CanvasCamera,
  CanvasItem,
  CanvasLink,
  CanvasMode,
  DrawingPoint,
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
  onCreateUploaded: (
    asset: Awaited<ReturnType<typeof uploadBoardFile>>,
    position: { x: number; y: number },
  ) => string;
  onCreateDrawing: (points: DrawingPoint[]) => string;
  onCreateLine: (points: DrawingPoint[]) => string;
  trashCount: number;
  onOpenTrash: () => void;
  onUpdate: (id: string, changes: Partial<CanvasItem>) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => string;
  onConnectStart: (id: string) => void;
  onEnterBoard: (item: CanvasItem) => void;
  onOpenDatabase: (item: CanvasItem) => void;
};

const DEFAULT_CAMERA: CanvasCamera = { x: 0, y: 0, zoom: 1 };
const ITEM_KINDS: ItemKind[] = [
  "note",
  "link",
  "todo",
  "column",
  "board",
  "comment",
  "table",
  "video",
];

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
  onCreateUploaded,
  onCreateDrawing,
  onCreateLine,
  trashCount,
  onOpenTrash,
  onUpdate,
  onDelete,
  onDuplicate,
  onConnectStart,
  onEnterBoard,
  onOpenDatabase,
}: CanvasViewProps) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const cameraRef = useRef(camera);
  const [liveCamera, setLiveCamera] = useState(camera);
  const [draftPoints, setDraftPoints] = useState<DrawingPoint[]>([]);
  const draftPointsRef = useRef<DrawingPoint[]>([]);

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

  const startStroke = (
    event: React.PointerEvent<HTMLElement>,
    strokeMode: "draw" | "line",
  ) => {
    if (mode !== strokeMode || event.button !== 0) return;
    if (event.target !== event.currentTarget) return;

    event.preventDefault();
    onSelect(null);

    const start = toWorld(event.clientX, event.clientY);
    const nextPoints = [start];
    draftPointsRef.current = nextPoints;
    setDraftPoints(nextPoints);

    const move = (moveEvent: PointerEvent) => {
      const point = toWorld(moveEvent.clientX, moveEvent.clientY);
      if (strokeMode === "line") {
        const updated = [start, point];
        draftPointsRef.current = updated;
        setDraftPoints(updated);
        return;
      }
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
        const id =
          strokeMode === "line"
            ? onCreateLine(points)
            : onCreateDrawing(points);
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

  const handleItemSelect = (item: CanvasItem) => {
    if (mode === "connect") {
      onLink(item.id);
      return;
    }
    onSelect(item.id);
  };

  const byId = new Map(items.map((item) => [item.id, item]));
  const canvasItems = items.filter((item) => !item.inUnsorted);
  const columns = canvasItems.filter((item) => item.kind === "column");
  const rootItems = canvasItems.filter(
    (item) => !item.parentColumnId && item.kind !== "column",
  );
  const selectedItem = selectedId ? byId.get(selectedId) : undefined;

  const assignToColumn = (childId: string, columnId: string, sortOrder: number) => {
    onUpdate(childId, {
      parentColumnId: columnId,
      sortOrder,
      inUnsorted: false,
    });
  };

  const releaseOnCanvas = (
    itemId: string,
    position: { x: number; y: number },
  ) => {
    onUpdate(itemId, {
      parentColumnId: null,
      inUnsorted: false,
      x: position.x - 130,
      y: position.y - 80,
    });
  };

  const importFiles = async (
    files: FileList,
    origin: { x: number; y: number },
  ) => {
    let offset = 0;
    for (const file of Array.from(files)) {
      try {
        const asset = await uploadBoardFile(file);
        const id = onCreateUploaded(asset, {
          x: origin.x + offset,
          y: origin.y + offset,
        });
        onSelect(id);
        offset += 28;
        onModeChange("select");
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
      className={`canvas-view mode-${mode}`}
      onPointerDown={(event) => {
        if (mode === "draw") {
          startStroke(event, "draw");
          return;
        }
        if (mode === "line") {
          startStroke(event, "line");
          return;
        }
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
          event.dataTransfer.types.includes("Files") ||
          event.dataTransfer.types.includes("application/x-libreta-item") ||
          event.dataTransfer.types.includes("text/plain")
        ) {
          event.preventDefault();
          event.dataTransfer.dropEffect = "copy";
        }
      }}
      onDrop={(event) => {
        event.preventDefault();
        const position = toWorld(event.clientX, event.clientY);

        if (event.dataTransfer.files.length > 0) {
          void importFiles(event.dataTransfer.files, {
            x: position.x - 130,
            y: position.y - 80,
          });
          return;
        }

        const moveId = event.dataTransfer.getData(
          "application/x-libreta-move-item",
        );
        if (moveId) {
          releaseOnCanvas(moveId, position);
          onSelect(moveId);
          return;
        }

        const unsortedId = event.dataTransfer.getData(
          "application/x-libreta-unsorted-item",
        );
        if (unsortedId) {
          releaseOnCanvas(unsortedId, position);
          onSelect(unsortedId);
          return;
        }

        const kind = (event.dataTransfer.getData(
          "application/x-libreta-item",
        ) || event.dataTransfer.getData("text/plain")) as ItemKind;
        if (!ITEM_KINDS.includes(kind)) return;
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
          <defs>
            <marker
              id="link-arrow"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#9696a6" />
            </marker>
          </defs>
          {links.map((link) => {
            const from = byId.get(link.fromId);
            const to = byId.get(link.toId);
            if (!from || !to) return null;
            const x1 = from.x + from.width / 2;
            const y1 = from.y + from.height / 2;
            const x2 = to.x + to.width / 2;
            const y2 = to.y + to.height / 2;
            return (
              <path
                key={link.id}
                className="connection-path"
                d={linkCurvePath(x1, y1, x2, y2)}
                markerEnd="url(#link-arrow)"
                onDoubleClick={(event) => {
                  event.stopPropagation();
                  onDeleteLink(link.id);
                }}
              />
            );
          })}
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
              onSelect={() => handleItemSelect(item)}
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
              linking={mode === "connect"}
              nestedPreview={[]}
              onSelect={() => handleItemSelect(item)}
              onMove={(x, y) => onUpdate(item.id, { x, y })}
              onResize={(width, height) => onUpdate(item.id, { width, height })}
              onUpdate={(changes) => onUpdate(item.id, changes)}
              onDelete={() => {
                onDelete(item.id);
                onSelect(null);
              }}
              onEnterBoard={() => onEnterBoard(item)}
              onOpenDatabase={() => onOpenDatabase(item)}
              onPrepareDrag={
                selectedId === item.id
                  ? (event) => {
                      event.dataTransfer.setData(
                        "application/x-libreta-move-item",
                        item.id,
                      );
                      event.dataTransfer.effectAllowed = "move";
                    }
                  : undefined
              }
            />
          ),
        )}

        {columns.map((column) => (
          <ColumnCard
            key={column.id}
            item={column}
            children={canvasItems.filter(
              (item) => item.parentColumnId === column.id,
            )}
            zoom={liveCamera.zoom}
            selectedId={selectedId}
            linking={mode === "connect"}
            onSelect={() => handleItemSelect(column)}
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
            onChildSelect={(id) => handleItemSelect(byId.get(id)!)}
            onAssignChild={(childId, sortOrder) =>
              assignToColumn(childId, column.id, sortOrder)
            }
            onEnterBoard={onEnterBoard}
            onOpenDatabase={onOpenDatabase}
          />
        ))}
      </div>

      <CanvasPalette
        mode={mode}
        trashCount={trashCount}
        onModeChange={onModeChange}
        onDragKind={() => undefined}
        onOpenTrash={onOpenTrash}
        onUploadFiles={(files) => {
          const rect = viewportRef.current?.getBoundingClientRect();
          if (!rect) return;
          const center = toWorld(
            rect.left + rect.width / 2,
            rect.top + rect.height / 2,
          );
          void importFiles(files, { x: center.x - 130, y: center.y - 80 });
        }}
      />

      {selectedItem ? (
        <div
          className="selection-bar-anchor"
          style={{
            left: selectedItem.x * liveCamera.zoom + liveCamera.x + 12,
            top:
              selectedItem.y * liveCamera.zoom +
              liveCamera.y -
              44,
          }}
        >
          <CanvasSelectionBar
            onDuplicate={() => onDuplicate(selectedItem.id)}
            onConnect={() => {
              onModeChange("connect");
              onConnectStart(selectedItem.id);
            }}
            onDelete={() => {
              onDelete(selectedItem.id);
              onSelect(null);
            }}
          />
        </div>
      ) : null}

      <div className="canvas-tools">
        <button
          type="button"
          className={mode === "select" ? "is-active" : ""}
          onClick={() => onModeChange("select")}
          title="Seleccionar (V)"
        >
          <Icon name="select" size={16} />
          <span>Seleccionar</span>
        </button>
        <button
          type="button"
          className={mode === "hand" ? "is-active" : ""}
          onClick={() => onModeChange("hand")}
          title="Mover lienzo (H)"
        >
          <Icon name="hand" size={16} />
          <span>Mover</span>
        </button>
      </div>

      <div className="canvas-controls">
        <button
          type="button"
          onClick={() => zoomAtCenter(0.85)}
          aria-label="Alejar"
        >
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
        <button
          type="button"
          onClick={() => zoomAtCenter(1.15)}
          aria-label="Acercar"
        >
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

      {mode === "draw" ? (
        <div className="connect-hint">Arrastra sobre el lienzo para dibujar</div>
      ) : null}

      {mode === "line" ? (
        <div className="connect-hint">
          Arrastra para crear una flecha en el diagrama
        </div>
      ) : null}
    </section>
  );
}

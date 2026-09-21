"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createId } from "@/lib/workspace/id";
import {
  createDefaultKanbanContent,
  createDefaultTodoContent,
} from "@/lib/workspace/blocks";
import { normalizeDrawingPoints } from "@/lib/workspace/drawing";
import {
  createInitialWorkspace,
  hasLocalWorkspace,
  loadWorkspace,
  normalizeWorkspace,
  saveWorkspace,
} from "@/lib/workspace/storage";
import type { DrawingPoint } from "@/lib/workspace/types";
import type {
  CanvasCamera,
  CanvasItem,
  ItemKind,
  WorkspaceState,
} from "@/lib/workspace/types";

export function useWorkspace() {
  const [state, setState] = useState<WorkspaceState | null>(null);
  const [persistenceStatus, setPersistenceStatus] = useState<
    "loading" | "saving" | "saved" | "error"
  >("loading");
  const hydratedRef = useRef(false);
  const pendingSaveRef = useRef<WorkspaceState | null>(null);
  const saveInFlightRef = useRef(false);
  const saveTimerRef = useRef<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    const restoreWorkspace = async () => {
      try {
        const response = await fetch("/api/workspace", { cache: "no-store" });
        if (!response.ok) throw new Error("Database unavailable");
        const result = (await response.json()) as {
          state: WorkspaceState;
          isNew: boolean;
        };
        const nextState =
          result.isNew && hasLocalWorkspace() ? loadWorkspace() : result.state;

        if (!cancelled) {
          hydratedRef.current = true;
          setState(nextState);
          setPersistenceStatus("saved");
        }
      } catch {
        if (!cancelled) {
          hydratedRef.current = true;
          setState(loadWorkspace());
          setPersistenceStatus("error");
        }
      }
    };

    void restoreWorkspace();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!state || !hydratedRef.current) return;

    const flushPendingSave = async () => {
      if (saveInFlightRef.current) return;

      saveInFlightRef.current = true;
      try {
        while (pendingSaveRef.current) {
          const nextState = pendingSaveRef.current;
          pendingSaveRef.current = null;
          const response = await fetch("/api/workspace", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(nextState),
          });
          if (!response.ok) throw new Error("Database save failed");
        }
        setPersistenceStatus("saved");
      } catch {
        setPersistenceStatus("error");
      } finally {
        saveInFlightRef.current = false;
        if (pendingSaveRef.current) {
          void flushPendingSave();
        }
      }
    };

    saveWorkspace(state);
    pendingSaveRef.current = state;
    setPersistenceStatus("saving");
    if (saveTimerRef.current !== null) {
      window.clearTimeout(saveTimerRef.current);
    }
    saveTimerRef.current = window.setTimeout(() => {
      saveTimerRef.current = null;
      void flushPendingSave();
    }, 350);

    return () => {
      if (saveTimerRef.current !== null) {
        window.clearTimeout(saveTimerRef.current);
      }
    };
  }, [state]);

  const activeCanvas = useMemo(
    () => state?.canvases.find((canvas) => canvas.id === state.activeCanvasId),
    [state],
  );

  const rootCanvases = useMemo(
    () => state?.canvases.filter((canvas) => canvas.parentId === null) ?? [],
    [state],
  );

  const items = useMemo(
    () =>
      state?.items.filter((item) => item.canvasId === state.activeCanvasId) ??
      [],
    [state],
  );

  const links = useMemo(
    () =>
      state?.links.filter((link) => link.canvasId === state.activeCanvasId) ??
      [],
    [state],
  );

  const parentCanvas = useMemo(
    () =>
      activeCanvas?.parentId
        ? state?.canvases.find((canvas) => canvas.id === activeCanvas.parentId)
        : undefined,
    [activeCanvas, state],
  );

  const update = (recipe: (current: WorkspaceState) => WorkspaceState) => {
    setState((current) => (current ? recipe(current) : current));
  };

  const createCanvas = () => {
    const id = createId();
    const now = Date.now();
    update((current) => {
      const rootCount = current.canvases.filter(
        (canvas) => canvas.parentId === null,
      ).length;
      return {
        ...current,
        activeCanvasId: id,
        canvases: [
          ...current.canvases,
          {
            id,
            name: `Espacio ${rootCount + 1}`,
            parentId: null,
            createdAt: now,
            updatedAt: now,
          },
        ],
        cameras: { ...current.cameras, [id]: { x: 0, y: 0, zoom: 1 } },
      };
    });
    return id;
  };

  const setActiveCanvas = (id: string) => {
    update((current) => ({ ...current, activeCanvasId: id }));
  };

  const enterCanvas = (id: string) => {
    update((current) => ({ ...current, activeCanvasId: id }));
  };

  const goToParentCanvas = () => {
    if (!activeCanvas?.parentId) return;
    setActiveCanvas(activeCanvas.parentId);
  };

  const renameCanvas = (name: string) => {
    update((current) => ({
      ...current,
      canvases: current.canvases.map((canvas) =>
        canvas.id === current.activeCanvasId
          ? { ...canvas, name, updatedAt: Date.now() }
          : canvas,
      ),
    }));
  };

  const deleteCanvas = (id: string) => {
    update((current) => {
      const nestedIds = new Set<string>();
      const collectNested = (canvasId: string) => {
        nestedIds.add(canvasId);
        current.canvases
          .filter((canvas) => canvas.parentId === canvasId)
          .forEach((canvas) => collectNested(canvas.id));
      };
      collectNested(id);

      const canvases = current.canvases.filter(
        (canvas) => !nestedIds.has(canvas.id),
      );
      const cameras = { ...current.cameras };
      nestedIds.forEach((canvasId) => delete cameras[canvasId]);
      const nextActiveCanvasId = nestedIds.has(current.activeCanvasId)
        ? (canvases.find((canvas) => canvas.parentId === null)?.id ??
          canvases[0]?.id ??
          "")
        : current.activeCanvasId;

      return {
        ...current,
        activeCanvasId: nextActiveCanvasId,
        canvases,
        items: current.items.filter((item) => !nestedIds.has(item.canvasId)),
        links: current.links.filter((link) => !nestedIds.has(link.canvasId)),
        cameras,
      };
    });
  };

  const createItem = (kind: ItemKind, position: { x: number; y: number }) => {
    if (!state?.activeCanvasId) return "";

    const id = createId();
    const now = Date.now();
    let nestedCanvasId: string | null = null;
    let extraCanvases = state.canvases;
    let extraCameras = state.cameras;

    if (kind === "board") {
      nestedCanvasId = createId();
      extraCanvases = [
        ...extraCanvases,
        {
          id: nestedCanvasId,
          name: "Pizarra anidada",
          parentId: state.activeCanvasId,
          createdAt: now,
          updatedAt: now,
        },
      ];
      extraCameras = {
        ...extraCameras,
        [nestedCanvasId]: { x: 0, y: 0, zoom: 1 },
      };
    }

    const item: CanvasItem = {
      id,
      canvasId: state.activeCanvasId,
      kind,
      title: defaultItemTitle(kind),
      content:
        kind === "text"
          ? "Escribe un texto"
          : kind === "todo"
            ? createDefaultTodoContent()
            : kind === "kanban"
              ? createDefaultKanbanContent()
              : kind === "comment"
                ? "Escribe tu comentario…"
                : "",
      url: kind === "link" ? "https://" : "",
      nestedCanvasId,
      databaseFields:
        kind === "database"
          ? [
              {
                id: createId(),
                name: "Nombre",
                type: "text",
                options: [],
              },
              {
                id: createId(),
                name: "Estado",
                type: "select",
                options: ["Pendiente", "En curso", "Listo"],
              },
            ]
          : [],
      databaseRecords: [],
      points: [],
      strokeColor: "#292929",
      strokeWidth: 2,
      x: position.x,
      y: position.y,
      width: defaultItemWidth(kind),
      height: defaultItemHeight(kind),
      color:
        kind === "note"
          ? "yellow"
          : kind === "comment"
            ? "sand"
            : kind === "kanban"
              ? "blue"
              : "white",
      createdAt: now,
      updatedAt: now,
    };

    update((current) => ({
      ...current,
      canvases: kind === "board" ? extraCanvases : current.canvases,
      cameras: kind === "board" ? extraCameras : current.cameras,
      items: [...current.items, item],
    }));

    return id;
  };

  const createLine = (worldPoints: DrawingPoint[]) => {
    if (!state?.activeCanvasId || worldPoints.length < 2) return "";

    const normalized = normalizeDrawingPoints([
      worldPoints[0],
      worldPoints.at(-1)!,
    ]);
    const id = createId();
    const now = Date.now();
    const item: CanvasItem = {
      id,
      canvasId: state.activeCanvasId,
      kind: "line",
      title: "",
      content: "",
      url: "",
      nestedCanvasId: null,
      databaseFields: [],
      databaseRecords: [],
      points: normalized.points,
      strokeColor: "#292929",
      strokeWidth: 2,
      x: normalized.x,
      y: normalized.y,
      width: normalized.width,
      height: normalized.height,
      color: "white",
      createdAt: now,
      updatedAt: now,
    };

    update((current) => ({
      ...current,
      items: [...current.items, item],
    }));

    return id;
  };

  const updateItem = (id: string, changes: Partial<CanvasItem>) => {
    update((current) => ({
      ...current,
      items: current.items.map((item) =>
        item.id === id ? { ...item, ...changes, updatedAt: Date.now() } : item,
      ),
    }));
  };

  const createDrawing = (worldPoints: DrawingPoint[]) => {
    if (!state?.activeCanvasId || worldPoints.length < 2) return "";

    const normalized = normalizeDrawingPoints(worldPoints);
    const id = createId();
    const now = Date.now();
    const item: CanvasItem = {
      id,
      canvasId: state.activeCanvasId,
      kind: "drawing",
      title: "",
      content: "",
      url: "",
      nestedCanvasId: null,
      databaseFields: [],
      databaseRecords: [],
      points: normalized.points,
      strokeColor: "#292929",
      strokeWidth: 2,
      x: normalized.x,
      y: normalized.y,
      width: normalized.width,
      height: normalized.height,
      color: "white",
      createdAt: now,
      updatedAt: now,
    };

    update((current) => ({
      ...current,
      items: [...current.items, item],
    }));

    return id;
  };

  const duplicateItem = (id: string) => {
    const newId = createId();
    update((current) => {
      const item = current.items.find((candidate) => candidate.id === id);
      if (!item) return current;

      const now = Date.now();
      let nestedCanvasId: string | null = null;
      let extraCanvases = current.canvases;
      let extraCameras = current.cameras;

      if (item.kind === "board" && item.nestedCanvasId) {
        nestedCanvasId = createId();
        extraCanvases = [
          ...extraCanvases,
          {
            id: nestedCanvasId,
            name: `${item.title || "Pizarra anidada"} (copia)`,
            parentId: item.canvasId,
            createdAt: now,
            updatedAt: now,
          },
        ];
        extraCameras = {
          ...extraCameras,
          [nestedCanvasId]: { x: 0, y: 0, zoom: 1 },
        };
      }

      const fieldIdMap = new Map<string, string>();
      const databaseFields = item.databaseFields.map((field) => {
        const fieldId = createId();
        fieldIdMap.set(field.id, fieldId);
        return {
          ...field,
          id: fieldId,
          options: [...field.options],
        };
      });

      const databaseRecords = item.databaseRecords.map((record) => {
        const recordId = createId();
        const cells: Record<string, string | boolean> = {};
        for (const [fieldId, value] of Object.entries(record.cells)) {
          const nextFieldId = fieldIdMap.get(fieldId);
          if (nextFieldId) cells[nextFieldId] = value;
        }
        return {
          id: recordId,
          cells,
          createdAt: now,
          updatedAt: now,
        };
      });

      const duplicate: CanvasItem = {
        ...item,
        id: newId,
        nestedCanvasId,
        databaseFields,
        databaseRecords,
        points: item.points.map((point) => ({ ...point })),
        x: item.x + 24,
        y: item.y + 24,
        createdAt: now,
        updatedAt: now,
      };

      return {
        ...current,
        canvases: item.kind === "board" ? extraCanvases : current.canvases,
        cameras: item.kind === "board" ? extraCameras : current.cameras,
        items: [...current.items, duplicate],
      };
    });
    return newId;
  };

  const deleteItem = (id: string) => {
    update((current) => {
      const item = current.items.find((candidate) => candidate.id === id);
      if (!item) return current;

      const nestedIds = new Set<string>();
      if (item.kind === "board" && item.nestedCanvasId) {
        const collectNested = (canvasId: string) => {
          nestedIds.add(canvasId);
          current.canvases
            .filter((canvas) => canvas.parentId === canvasId)
            .forEach((canvas) => collectNested(canvas.id));
        };
        collectNested(item.nestedCanvasId);
      }

      const canvases = current.canvases.filter(
        (canvas) => !nestedIds.has(canvas.id),
      );
      const cameras = { ...current.cameras };
      nestedIds.forEach((canvasId) => delete cameras[canvasId]);
      const nextActiveCanvasId = nestedIds.has(current.activeCanvasId)
        ? (canvases.find((canvas) => canvas.parentId === null)?.id ??
          canvases[0]?.id ??
          "")
        : current.activeCanvasId;

      return {
        ...current,
        activeCanvasId: nextActiveCanvasId,
        canvases,
        cameras,
        trash: [
          { item, deletedAt: Date.now() },
          ...current.trash.filter((entry) => entry.item.id !== item.id),
        ],
        items: current.items.filter(
          (candidate) =>
            candidate.id !== id && !nestedIds.has(candidate.canvasId),
        ),
        links: current.links.filter(
          (link) =>
            link.fromId !== id &&
            link.toId !== id &&
            !nestedIds.has(link.canvasId),
        ),
      };
    });
  };

  const restoreFromTrash = (itemId: string) => {
    update((current) => {
      const entry = current.trash.find((candidate) => candidate.item.id === itemId);
      if (!entry) return current;

      const canvasExists = current.canvases.some(
        (canvas) => canvas.id === entry.item.canvasId,
      );
      if (!canvasExists) return current;

      return {
        ...current,
        items: [...current.items, entry.item],
        trash: current.trash.filter((candidate) => candidate.item.id !== itemId),
      };
    });
  };

  const purgeFromTrash = (itemId: string) => {
    update((current) => ({
      ...current,
      trash: current.trash.filter((candidate) => candidate.item.id !== itemId),
    }));
  };

  const createLink = (fromId: string, toId: string) => {
    if (!state?.activeCanvasId || fromId === toId) return;
    const exists = state.links.some(
      (link) =>
        link.canvasId === state.activeCanvasId &&
        ((link.fromId === fromId && link.toId === toId) ||
          (link.fromId === toId && link.toId === fromId)),
    );
    if (exists) return;

    update((current) => ({
      ...current,
      links: [
        ...current.links,
        {
          id: createId(),
          canvasId: current.activeCanvasId,
          fromId,
          toId,
        },
      ],
    }));
  };

  const deleteLink = (linkId: string) => {
    update((current) => ({
      ...current,
      links: current.links.filter((link) => link.id !== linkId),
    }));
  };

  const updateCamera = (camera: CanvasCamera) => {
    update((current) => ({
      ...current,
      cameras: {
        ...current.cameras,
        [current.activeCanvasId]: camera,
      },
    }));
  };

  const getNestedPreview = useCallback(
    (canvasId: string) => {
      if (!state) return [];
      return state.items
        .filter((item) => item.canvasId === canvasId)
        .slice(0, 4);
    },
    [state],
  );

  const resetWorkspace = useCallback(() => {
    setState(createInitialWorkspace());
  }, []);

  return {
    state,
    activeCanvas,
    parentCanvas,
    rootCanvases,
    items,
    links,
    createCanvas,
    setActiveCanvas,
    enterCanvas,
    goToParentCanvas,
    renameCanvas,
    deleteCanvas,
    createItem,
    createDrawing,
    createLine,
    duplicateItem,
    updateItem,
    deleteItem,
    restoreFromTrash,
    purgeFromTrash,
    trash: state?.trash ?? [],
    createLink,
    deleteLink,
    updateCamera,
    getNestedPreview,
    resetWorkspace,
    persistenceStatus,
  };
}

function defaultItemTitle(kind: ItemKind) {
  if (kind === "board") return "Pizarra anidada";
  if (kind === "link") return "Enlace";
  if (kind === "image") return "Imagen";
  if (kind === "database") return "Base de datos";
  if (kind === "todo") return "To-do";
  if (kind === "kanban") return "Tablero";
  if (kind === "comment") return "";
  if (kind === "text") return "";
  return "Nueva nota";
}

function defaultItemWidth(kind: ItemKind) {
  if (kind === "text") return 280;
  if (kind === "board") return 260;
  if (kind === "link") return 240;
  if (kind === "image") return 220;
  if (kind === "database") return 420;
  if (kind === "drawing") return 120;
  if (kind === "todo") return 260;
  if (kind === "kanban") return 480;
  if (kind === "comment") return 220;
  if (kind === "line") return 120;
  return 280;
}

function defaultItemHeight(kind: ItemKind) {
  if (kind === "text") return 90;
  if (kind === "board") return 180;
  if (kind === "link") return 110;
  if (kind === "image") return 160;
  if (kind === "database") return 240;
  if (kind === "drawing") return 80;
  if (kind === "todo") return 180;
  if (kind === "kanban") return 280;
  if (kind === "comment") return 120;
  if (kind === "line") return 40;
  return 200;
}

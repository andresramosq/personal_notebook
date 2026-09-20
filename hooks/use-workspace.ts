"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createId } from "@/lib/workspace/id";
import {
  createInitialWorkspace,
  hasLocalWorkspace,
  loadWorkspace,
  saveWorkspace,
} from "@/lib/workspace/storage";
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

    saveWorkspace(state);
    setPersistenceStatus("saving");
    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      try {
        const response = await fetch("/api/workspace", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(state),
          signal: controller.signal,
        });
        if (!response.ok) throw new Error("Database save failed");
        setPersistenceStatus("saved");
      } catch (error) {
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          setPersistenceStatus("error");
        }
      }
    }, 350);

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
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
      const rootCount = current.canvases.filter(
        (canvas) => canvas.parentId === null,
      ).length;
      if (rootCount <= 1) {
        return current;
      }

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

      return {
        ...current,
        activeCanvasId: nestedIds.has(current.activeCanvasId)
          ? canvases[0].id
          : current.activeCanvasId,
        canvases,
        items: current.items.filter((item) => !nestedIds.has(item.canvasId)),
        links: current.links.filter((link) => !nestedIds.has(link.canvasId)),
        cameras,
      };
    });
  };

  const createItem = (kind: ItemKind, position: { x: number; y: number }) => {
    if (!state) return "";

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
      content: kind === "text" ? "Escribe un texto" : "",
      url: kind === "link" ? "https://" : "",
      nestedCanvasId,
      x: position.x,
      y: position.y,
      width: defaultItemWidth(kind),
      height: defaultItemHeight(kind),
      color: kind === "note" ? "yellow" : "white",
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

  const updateItem = (id: string, changes: Partial<CanvasItem>) => {
    update((current) => ({
      ...current,
      items: current.items.map((item) =>
        item.id === id ? { ...item, ...changes, updatedAt: Date.now() } : item,
      ),
    }));
  };

  const deleteItem = (id: string) => {
    update((current) => {
      const item = current.items.find((candidate) => candidate.id === id);
      const nestedIds = new Set<string>();
      if (item?.kind === "board" && item.nestedCanvasId) {
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

      return {
        ...current,
        activeCanvasId: nestedIds.has(current.activeCanvasId)
          ? (item?.canvasId ?? canvases[0].id)
          : current.activeCanvasId,
        canvases,
        cameras,
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

  const createLink = (fromId: string, toId: string) => {
    if (!state || fromId === toId) return;
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
    updateItem,
    deleteItem,
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
  if (kind === "text") return "";
  return "Nueva nota";
}

function defaultItemWidth(kind: ItemKind) {
  if (kind === "text") return 280;
  if (kind === "board") return 260;
  if (kind === "link") return 240;
  if (kind === "image") return 220;
  return 280;
}

function defaultItemHeight(kind: ItemKind) {
  if (kind === "text") return 90;
  if (kind === "board") return 180;
  if (kind === "link") return 110;
  if (kind === "image") return 160;
  return 200;
}

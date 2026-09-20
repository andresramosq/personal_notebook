"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createId } from "@/lib/workspace/id";
import {
  createInitialWorkspace,
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

  useEffect(() => {
    // Client-only restore from localStorage after hydration.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional one-time bootstrap
    setState(loadWorkspace());
  }, []);

  useEffect(() => {
    if (state) {
      saveWorkspace(state);
    }
  }, [state]);

  const activeCanvas = useMemo(
    () => state?.canvases.find((canvas) => canvas.id === state.activeCanvasId),
    [state],
  );

  const items = useMemo(
    () =>
      state?.items.filter((item) => item.canvasId === state.activeCanvasId) ??
      [],
    [state],
  );

  const update = (recipe: (current: WorkspaceState) => WorkspaceState) => {
    setState((current) => (current ? recipe(current) : current));
  };

  const createCanvas = () => {
    const id = createId();
    const now = Date.now();
    update((current) => ({
      ...current,
      activeCanvasId: id,
      canvases: [
        ...current.canvases,
        {
          id,
          name: `Lienzo ${current.canvases.length + 1}`,
          createdAt: now,
          updatedAt: now,
        },
      ],
      cameras: { ...current.cameras, [id]: { x: 0, y: 0, zoom: 1 } },
    }));
    return id;
  };

  const setActiveCanvas = (id: string) => {
    update((current) => ({ ...current, activeCanvasId: id }));
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

  const duplicateCanvas = (id: string) => {
    if (!state) return;
    const source = state.canvases.find((canvas) => canvas.id === id);
    if (!source) return;

    const newId = createId();
    const now = Date.now();
    const copiedItems = state.items
      .filter((item) => item.canvasId === id)
      .map((item) => ({
        ...item,
        id: createId(),
        canvasId: newId,
        createdAt: now,
        updatedAt: now,
        checklist: item.checklist.map((entry) => ({
          ...entry,
          id: createId(),
        })),
      }));

    update((current) => ({
      ...current,
      activeCanvasId: newId,
      canvases: [
        ...current.canvases,
        {
          ...source,
          id: newId,
          name: `${source.name} (copia)`,
          createdAt: now,
          updatedAt: now,
        },
      ],
      items: [...current.items, ...copiedItems],
      cameras: {
        ...current.cameras,
        [newId]: current.cameras[id] ?? { x: 0, y: 0, zoom: 1 },
      },
    }));
  };

  const deleteCanvas = (id: string) => {
    update((current) => {
      if (current.canvases.length === 1) {
        return current;
      }

      const canvases = current.canvases.filter((canvas) => canvas.id !== id);
      const cameras = { ...current.cameras };
      delete cameras[id];

      return {
        ...current,
        activeCanvasId:
          current.activeCanvasId === id
            ? canvases[0].id
            : current.activeCanvasId,
        canvases,
        items: current.items.filter((item) => item.canvasId !== id),
        cameras,
      };
    });
  };

  const createItem = (kind: ItemKind, position: { x: number; y: number }) => {
    if (!state) {
      return "";
    }

    const id = createId();
    const now = Date.now();
    const defaults: Record<
      ItemKind,
      Pick<
        CanvasItem,
        "title" | "content" | "width" | "height" | "color" | "checklist"
      >
    > = {
      note: {
        title: "Nueva nota",
        content: "",
        width: 280,
        height: 190,
        color: "white",
        checklist: [],
      },
      text: {
        title: "",
        content: "Escribe un texto",
        width: 300,
        height: 90,
        color: "white",
        checklist: [],
      },
      checklist: {
        title: "Nueva lista",
        content: "",
        width: 300,
        height: 220,
        color: "white",
        checklist: [{ id: createId(), text: "", checked: false }],
      },
    };
    const preset = defaults[kind];
    const item: CanvasItem = {
      id,
      canvasId: state.activeCanvasId,
      kind,
      title: preset.title,
      content: preset.content,
      checklist: preset.checklist,
      x: position.x,
      y: position.y,
      width: preset.width,
      height: preset.height,
      color: preset.color,
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

  const deleteItem = (id: string) => {
    update((current) => ({
      ...current,
      items: current.items.filter((item) => item.id !== id),
    }));
  };

  const duplicateItem = (id: string) => {
    const item = state?.items.find((candidate) => candidate.id === id);
    if (!item) return "";
    const newId = createId();
    const now = Date.now();
    update((current) => ({
      ...current,
      items: [
        ...current.items,
        {
          ...item,
          id: newId,
          x: item.x + 28,
          y: item.y + 28,
          checklist: item.checklist.map((entry) => ({
            ...entry,
            id: createId(),
          })),
          createdAt: now,
          updatedAt: now,
        },
      ],
    }));
    return newId;
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

  const resetWorkspace = useCallback(() => {
    setState(createInitialWorkspace());
  }, []);

  const exportWorkspace = () => {
    if (!state) return;
    const blob = new Blob([JSON.stringify(state, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `libreta-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return {
    state,
    activeCanvas,
    items,
    createCanvas,
    setActiveCanvas,
    renameCanvas,
    duplicateCanvas,
    deleteCanvas,
    createItem,
    updateItem,
    duplicateItem,
    deleteItem,
    updateCamera,
    exportWorkspace,
    resetWorkspace,
  };
}

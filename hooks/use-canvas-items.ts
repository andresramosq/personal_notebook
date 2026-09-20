"use client";

import { useEffect, useState } from "react";
import { loadCanvasItems, saveCanvasItems } from "@/lib/canvas/storage";
import type { CanvasItem, CanvasItemType } from "@/lib/canvas/types";

const ITEM_DEFAULTS: Record<
  CanvasItemType,
  Pick<CanvasItem, "width" | "height" | "title" | "content" | "color">
> = {
  note: {
    width: 260,
    height: 210,
    title: "Nueva nota",
    content: "Escribe una idea…",
    color: "#fff6c7",
  },
  task: {
    width: 260,
    height: 150,
    title: "Nueva tarea",
    content: "Describe el siguiente paso…",
    color: "#ffffff",
  },
  text: {
    width: 280,
    height: 120,
    title: "Texto",
    content: "Escribe aquí…",
    color: "transparent",
  },
  shape: {
    width: 220,
    height: 140,
    title: "Grupo",
    content: "",
    color: "#dbeafe",
  },
};

export function useCanvasItems() {
  const [items, setItems] = useState<CanvasItem[]>([]);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    setItems(loadCanvasItems());
    setIsReady(true);
  }, []);

  useEffect(() => {
    if (isReady) {
      saveCanvasItems(items);
    }
  }, [isReady, items]);

  const createItem = (type: CanvasItemType, x: number, y: number) => {
    const now = Date.now();
    const item: CanvasItem = {
      id: crypto.randomUUID(),
      type,
      x,
      y,
      completed: false,
      createdAt: now,
      updatedAt: now,
      ...ITEM_DEFAULTS[type],
    };

    setItems((current) => [...current, item]);
    return item.id;
  };

  const updateItem = (id: string, changes: Partial<CanvasItem>) => {
    setItems((current) =>
      current.map((item) =>
        item.id === id
          ? { ...item, ...changes, updatedAt: Date.now() }
          : item,
      ),
    );
  };

  const deleteItem = (id: string) => {
    setItems((current) => current.filter((item) => item.id !== id));
  };

  return {
    items,
    isReady,
    createItem,
    updateItem,
    deleteItem,
  };
}

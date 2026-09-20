"use client";

import { useEffect, useMemo, useState } from "react";
import {
  createInitialWorkspace,
  loadWorkspace,
  saveWorkspace,
} from "@/lib/workspace/storage";
import type {
  WorkspaceLink,
  WorkspaceObject,
  WorkspaceState,
  WorkspaceView,
} from "@/lib/workspace/types";

export function useWorkspace() {
  const [state, setState] = useState<WorkspaceState | null>(null);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setState(loadWorkspace()));
    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (state) {
      saveWorkspace(state);
    }
  }, [state]);

  const activeSpace = useMemo(
    () => state?.spaces.find((space) => space.id === state.activeSpaceId),
    [state],
  );

  const objects = useMemo(
    () =>
      state?.objects.filter((object) => object.spaceId === state.activeSpaceId) ??
      [],
    [state],
  );

  const links = useMemo(
    () =>
      state?.links.filter((link) => link.spaceId === state.activeSpaceId) ?? [],
    [state],
  );

  const update = (recipe: (current: WorkspaceState) => WorkspaceState) => {
    setState((current) => (current ? recipe(current) : current));
  };

  const createSpace = () => {
    const id = crypto.randomUUID();
    update((current) => ({
      ...current,
      activeSpaceId: id,
      spaces: [
        ...current.spaces,
        {
          id,
          name: `Espacio ${current.spaces.length + 1}`,
          view: "canvas",
          createdAt: Date.now(),
        },
      ],
    }));
  };

  const setActiveSpace = (id: string) => {
    update((current) => ({ ...current, activeSpaceId: id }));
  };

  const updateSpace = (changes: { name?: string; view?: WorkspaceView }) => {
    update((current) => ({
      ...current,
      spaces: current.spaces.map((space) =>
        space.id === current.activeSpaceId ? { ...space, ...changes } : space,
      ),
    }));
  };

  const deleteSpace = (id: string) => {
    update((current) => {
      if (current.spaces.length === 1) {
        return current;
      }

      const spaces = current.spaces.filter((space) => space.id !== id);
      const objectIds = new Set(
        current.objects
          .filter((object) => object.spaceId === id)
          .map((object) => object.id),
      );

      return {
        ...current,
        activeSpaceId:
          current.activeSpaceId === id ? spaces[0].id : current.activeSpaceId,
        spaces,
        objects: current.objects.filter((object) => object.spaceId !== id),
        links: current.links.filter(
          (link) =>
            link.spaceId !== id &&
            !objectIds.has(link.fromId) &&
            !objectIds.has(link.toId),
        ),
      };
    });
  };

  const createObject = (position?: { x: number; y: number }) => {
    if (!state) {
      return "";
    }

    const id = crypto.randomUUID();
    const now = Date.now();
    const index = objects.length;
    const object: WorkspaceObject = {
      id,
      spaceId: state.activeSpaceId,
      title: "Nuevo objeto",
      description: "",
      status: "inbox",
      x: position?.x ?? 160 + (index % 5) * 32,
      y: position?.y ?? 120 + (index % 5) * 32,
      width: 280,
      height: 180,
      color: "#ffffff",
      startDate: "",
      endDate: "",
      reminder: "",
      recurrence: "",
      person: "",
      tags: [],
      properties: [],
      createdAt: now,
      updatedAt: now,
    };

    update((current) => ({
      ...current,
      objects: [...current.objects, object],
    }));

    return id;
  };

  const updateObject = (id: string, changes: Partial<WorkspaceObject>) => {
    update((current) => ({
      ...current,
      objects: current.objects.map((object) =>
        object.id === id
          ? { ...object, ...changes, updatedAt: Date.now() }
          : object,
      ),
    }));
  };

  const deleteObject = (id: string) => {
    update((current) => ({
      ...current,
      objects: current.objects.filter((object) => object.id !== id),
      links: current.links.filter(
        (link) => link.fromId !== id && link.toId !== id,
      ),
    }));
  };

  const createLink = (fromId: string, toId: string) => {
    if (!state || fromId === toId) {
      return;
    }

    const exists = state.links.some(
      (link) =>
        link.spaceId === state.activeSpaceId &&
        ((link.fromId === fromId && link.toId === toId) ||
          (link.fromId === toId && link.toId === fromId)),
    );

    if (exists) {
      return;
    }

    const link: WorkspaceLink = {
      id: crypto.randomUUID(),
      spaceId: state.activeSpaceId,
      fromId,
      toId,
      label: "",
    };

    update((current) => ({ ...current, links: [...current.links, link] }));
  };

  const deleteLink = (id: string) => {
    update((current) => ({
      ...current,
      links: current.links.filter((link) => link.id !== id),
    }));
  };

  const reset = () => setState(createInitialWorkspace());

  return {
    state,
    activeSpace,
    objects,
    links,
    createSpace,
    setActiveSpace,
    updateSpace,
    deleteSpace,
    createObject,
    updateObject,
    deleteObject,
    createLink,
    deleteLink,
    reset,
  };
}

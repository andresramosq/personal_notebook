import { createId } from "@/lib/workspace/id";
import type {
  CanvasItem,
  ItemColor,
  ItemKind,
  WorkspaceCanvas,
  WorkspaceState,
} from "@/lib/workspace/types";

const STORAGE_KEY = "libreta:workspace:v1";
const DEFAULT_CAMERA = { x: 0, y: 0, zoom: 1 };

export function createInitialWorkspace(): WorkspaceState {
  const now = Date.now();
  const canvasId = createId();

  return {
    version: 2,
    activeCanvasId: canvasId,
    canvases: [
      {
        id: canvasId,
        name: "Mi primer lienzo",
        createdAt: now,
        updatedAt: now,
      },
    ],
    items: [],
    cameras: {
      [canvasId]: DEFAULT_CAMERA,
    },
  };
}

export function loadWorkspace(): WorkspaceState {
  if (typeof window === "undefined") {
    return createInitialWorkspace();
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);

    if (!raw) {
      return createInitialWorkspace();
    }

    const parsed = JSON.parse(raw) as Partial<WorkspaceState> & LegacyWorkspace;
    const state =
      parsed.version === 2
        ? parsed
        : parsed.version === 1 || parsed.spaces
          ? migrateLegacyWorkspace(parsed)
          : createInitialWorkspace();

    return normalizeWorkspace(state);
  } catch {
    return createInitialWorkspace();
  }
}

export function saveWorkspace(state: WorkspaceState) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(normalizeWorkspace(state)),
  );
}

type LegacyWorkspace = {
  version?: number;
  activeSpaceId?: string;
  activeCanvasId?: string;
  spaces?: Array<{ id: string; name: string; createdAt?: number }>;
  objects?: Array<{
    id: string;
    spaceId: string;
    kind?: string;
    title?: string;
    description?: string;
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    color?: string;
    createdAt?: number;
    updatedAt?: number;
    databaseRows?: Array<{ id: string; title: string; status?: string }>;
  }>;
};

function migrateLegacyWorkspace(legacy: LegacyWorkspace): WorkspaceState {
  if (!Array.isArray(legacy.spaces) || legacy.spaces.length === 0) {
    return createInitialWorkspace();
  }

  const now = Date.now();
  const canvases: WorkspaceCanvas[] = legacy.spaces.map((space) => ({
    id: space.id,
    name: space.name || "Lienzo sin título",
    createdAt: space.createdAt ?? now,
    updatedAt: now,
  }));
  const canvasIds = new Set(canvases.map((canvas) => canvas.id));
  const items = (legacy.objects ?? [])
    .filter((object) => canvasIds.has(object.spaceId))
    .map((object): CanvasItem => {
      const kind: ItemKind =
        object.kind === "text"
          ? "text"
          : object.kind === "database"
            ? "checklist"
            : "note";
      const checklist =
        kind === "checklist"
          ? (object.databaseRows ?? []).map((row) => ({
              id: row.id || createId(),
              text: row.title ?? "",
              checked: row.status === "done",
            }))
          : [];

      return {
        id: object.id || createId(),
        canvasId: object.spaceId,
        kind,
        title: object.title ?? "",
        content: object.description ?? "",
        checklist,
        x: object.x ?? 120,
        y: object.y ?? 120,
        width: object.width ?? (kind === "text" ? 260 : 280),
        height: object.height ?? (kind === "text" ? 90 : 190),
        color: migrateColor(object.color),
        createdAt: object.createdAt ?? now,
        updatedAt: object.updatedAt ?? now,
      };
    });

  const preferredId = legacy.activeCanvasId ?? legacy.activeSpaceId;
  const activeCanvasId = canvasIds.has(preferredId ?? "")
    ? preferredId!
    : canvases[0].id;

  return normalizeWorkspace({
    version: 2,
    canvases,
    items,
    cameras: Object.fromEntries(
      canvases.map((canvas) => [canvas.id, DEFAULT_CAMERA]),
    ),
    activeCanvasId,
  });
}

function normalizeWorkspace(
  state: Partial<WorkspaceState>,
): WorkspaceState {
  const now = Date.now();
  let canvases = Array.isArray(state.canvases)
    ? state.canvases.filter((canvas) => canvas?.id)
    : [];

  if (!canvases.length) {
    const canvasId = createId();
    canvases = [
      {
        id: canvasId,
        name: "Mi primer lienzo",
        createdAt: now,
        updatedAt: now,
      },
    ];
  }

  const canvasIds = new Set(canvases.map((canvas) => canvas.id));
  const activeCanvasId = canvasIds.has(state.activeCanvasId ?? "")
    ? state.activeCanvasId!
    : canvases[0].id;

  const cameras = { ...(state.cameras ?? {}) };
  for (const canvas of canvases) {
    if (!cameras[canvas.id]) {
      cameras[canvas.id] = DEFAULT_CAMERA;
    }
  }

  const items = (Array.isArray(state.items) ? state.items : [])
    .filter((item) => canvasIds.has(item.canvasId))
    .map((item) => normalizeItem(item, now));

  return {
    version: 2,
    canvases,
    items,
    cameras,
    activeCanvasId,
  };
}

function normalizeItem(item: Partial<CanvasItem>, now: number): CanvasItem {
  const kind: ItemKind =
    item.kind === "text" || item.kind === "checklist" ? item.kind : "note";

  return {
    id: item.id || createId(),
    canvasId: item.canvasId!,
    kind,
    title: item.title ?? (kind === "note" ? "Nueva nota" : ""),
    content: item.content ?? "",
    checklist: Array.isArray(item.checklist)
      ? item.checklist.map((entry) => ({
          id: entry.id || createId(),
          text: entry.text ?? "",
          checked: Boolean(entry.checked),
        }))
      : [],
    x: typeof item.x === "number" ? item.x : 120,
    y: typeof item.y === "number" ? item.y : 120,
    width: typeof item.width === "number" ? item.width : 280,
    height: typeof item.height === "number" ? item.height : 190,
    color: isItemColor(item.color) ? item.color : "white",
    createdAt: item.createdAt ?? now,
    updatedAt: item.updatedAt ?? now,
  };
}

function migrateColor(value?: string): ItemColor {
  const colors: Record<string, ItemColor> = {
    "#fff3bf": "yellow",
    "#dbeafe": "blue",
    "#f3e8ff": "rose",
    transparent: "white",
  };
  return colors[value ?? ""] ?? "white";
}

function isItemColor(value: unknown): value is ItemColor {
  return (
    value === "white" ||
    value === "sand" ||
    value === "yellow" ||
    value === "blue" ||
    value === "green" ||
    value === "rose"
  );
}

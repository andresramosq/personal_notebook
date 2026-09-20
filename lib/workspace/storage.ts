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

export function hasLocalWorkspace() {
  return (
    typeof window !== "undefined" &&
    window.localStorage.getItem(STORAGE_KEY) !== null
  );
}

export function createInitialWorkspace(): WorkspaceState {
  const now = Date.now();
  const canvasId = createId();

  return {
    version: 3,
    activeCanvasId: canvasId,
    canvases: [
      {
        id: canvasId,
        name: "Proyecto Libreta",
        parentId: null,
        createdAt: now,
        updatedAt: now,
      },
    ],
    items: [],
    links: [],
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

    if (parsed.version === 3) {
      return normalizeWorkspace(parsed);
    }

    if (parsed.version === 2) {
      return normalizeWorkspace(migrateFromV2(parsed));
    }

    if (parsed.version === 1 || parsed.spaces) {
      return normalizeWorkspace(migrateLegacyWorkspace(parsed));
    }

    return createInitialWorkspace();
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

function migrateFromV2(
  state: Partial<WorkspaceState>,
): Partial<WorkspaceState> {
  const now = Date.now();
  return {
    version: 3,
    activeCanvasId: state.activeCanvasId,
    canvases: (state.canvases ?? []).map((canvas) => ({
      ...canvas,
      parentId: canvas.parentId ?? null,
      updatedAt: canvas.updatedAt ?? now,
    })),
    items: (state.items ?? []).map((item) => ({
      id: item.id,
      canvasId: item.canvasId,
      kind: migrateKind(item.kind),
      title: item.title ?? "",
      content: item.content ?? "",
      url: item.url ?? "",
      nestedCanvasId: item.nestedCanvasId ?? null,
      databaseFields: item.databaseFields ?? [],
      databaseRecords: item.databaseRecords ?? [],
      x: item.x ?? 120,
      y: item.y ?? 120,
      width: item.width ?? 280,
      height: item.height ?? 190,
      color: item.color ?? "white",
      createdAt: item.createdAt ?? now,
      updatedAt: item.updatedAt ?? now,
    })),
    links: state.links ?? [],
    cameras: state.cameras ?? {},
  };
}

function migrateLegacyWorkspace(
  legacy: LegacyWorkspace,
): Partial<WorkspaceState> {
  if (!Array.isArray(legacy.spaces) || legacy.spaces.length === 0) {
    return createInitialWorkspace();
  }

  const now = Date.now();
  const canvases: WorkspaceCanvas[] = legacy.spaces.map((space) => ({
    id: space.id,
    name: space.name || "Lienzo sin título",
    parentId: null,
    createdAt: space.createdAt ?? now,
    updatedAt: now,
  }));
  const canvasIds = new Set(canvases.map((canvas) => canvas.id));
  const items = (legacy.objects ?? [])
    .filter((object) => canvasIds.has(object.spaceId))
    .map((object): CanvasItem => ({
      id: object.id || createId(),
      canvasId: object.spaceId,
      kind: object.kind === "text" ? "text" : "note",
      title: object.title ?? "",
      content: object.description ?? "",
      url: "",
      nestedCanvasId: null,
      databaseFields: [],
      databaseRecords: [],
      x: object.x ?? 120,
      y: object.y ?? 120,
      width: object.width ?? (object.kind === "text" ? 260 : 280),
      height: object.height ?? (object.kind === "text" ? 90 : 190),
      color: migrateColor(object.color),
      createdAt: object.createdAt ?? now,
      updatedAt: object.updatedAt ?? now,
    }));

  const preferredId = legacy.activeCanvasId ?? legacy.activeSpaceId;
  const activeCanvasId = canvasIds.has(preferredId ?? "")
    ? preferredId!
    : canvases[0].id;

  return {
    version: 3,
    canvases,
    items,
    links: [],
    cameras: Object.fromEntries(
      canvases.map((canvas) => [canvas.id, DEFAULT_CAMERA]),
    ),
    activeCanvasId,
  };
}

function normalizeWorkspace(state: Partial<WorkspaceState>): WorkspaceState {
  const now = Date.now();
  let canvases = Array.isArray(state.canvases)
    ? state.canvases
        .filter((canvas) => canvas?.id)
        .map((canvas) => ({
          id: canvas.id,
          name: canvas.name || "Sin título",
          parentId: canvas.parentId ?? null,
          createdAt: canvas.createdAt ?? now,
          updatedAt: canvas.updatedAt ?? now,
        }))
    : [];

  if (!canvases.length) {
    const canvasId = createId();
    canvases = [
      {
        id: canvasId,
        name: "Proyecto Libreta",
        parentId: null,
        createdAt: now,
        updatedAt: now,
      },
    ];
  }

  const canvasIds = new Set(canvases.map((canvas) => canvas.id));
  const activeCanvasId = canvasIds.has(state.activeCanvasId ?? "")
    ? state.activeCanvasId!
    : (canvases.find((canvas) => canvas.parentId === null)?.id ??
      canvases[0].id);

  const cameras = { ...(state.cameras ?? {}) };
  for (const canvas of canvases) {
    if (!cameras[canvas.id]) {
      cameras[canvas.id] = DEFAULT_CAMERA;
    }
  }

  const items = (Array.isArray(state.items) ? state.items : [])
    .filter((item) => canvasIds.has(item.canvasId))
    .map((item) => normalizeItem(item, now, canvasIds));

  const itemIds = new Set(items.map((item) => item.id));
  const links = (Array.isArray(state.links) ? state.links : [])
    .filter(
      (link) =>
        canvasIds.has(link.canvasId) &&
        itemIds.has(link.fromId) &&
        itemIds.has(link.toId),
    )
    .map((link) => ({
      id: link.id || createId(),
      canvasId: link.canvasId,
      fromId: link.fromId,
      toId: link.toId,
    }));

  return {
    version: 3,
    canvases,
    items,
    links,
    cameras,
    activeCanvasId,
  };
}

function normalizeItem(
  item: Partial<CanvasItem>,
  now: number,
  canvasIds: Set<string>,
): CanvasItem {
  const kind = migrateKind(item.kind);
  let nestedCanvasId = item.nestedCanvasId ?? null;
  if (kind === "board" && nestedCanvasId && !canvasIds.has(nestedCanvasId)) {
    nestedCanvasId = null;
  }

  return {
    id: item.id || createId(),
    canvasId: item.canvasId!,
    kind,
    title: item.title ?? defaultTitle(kind),
    content: item.content ?? "",
    url: item.url ?? "",
    nestedCanvasId,
    databaseFields: Array.isArray(item.databaseFields)
      ? item.databaseFields
      : [],
    databaseRecords: Array.isArray(item.databaseRecords)
      ? item.databaseRecords
      : [],
    x: typeof item.x === "number" ? item.x : 120,
    y: typeof item.y === "number" ? item.y : 120,
    width: typeof item.width === "number" ? item.width : defaultWidth(kind),
    height: typeof item.height === "number" ? item.height : defaultHeight(kind),
    color: isItemColor(item.color)
      ? item.color
      : kind === "note"
        ? "yellow"
        : "white",
    createdAt: item.createdAt ?? now,
    updatedAt: item.updatedAt ?? now,
  };
}

function migrateKind(kind?: string): ItemKind {
  if (kind === "text") return "text";
  if (kind === "board") return "board";
  if (kind === "link") return "link";
  if (kind === "image") return "image";
  if (kind === "database") return "database";
  return "note";
}

function defaultTitle(kind: ItemKind) {
  if (kind === "board") return "Pizarra anidada";
  if (kind === "link") return "Enlace";
  if (kind === "image") return "Imagen";
  if (kind === "database") return "Base de datos";
  if (kind === "text") return "";
  return "Nueva nota";
}

function defaultWidth(kind: ItemKind) {
  if (kind === "text") return 280;
  if (kind === "board") return 260;
  if (kind === "link") return 240;
  if (kind === "image") return 220;
  if (kind === "database") return 420;
  return 280;
}

function defaultHeight(kind: ItemKind) {
  if (kind === "text") return 90;
  if (kind === "board") return 180;
  if (kind === "link") return 110;
  if (kind === "image") return 160;
  if (kind === "database") return 240;
  return 200;
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

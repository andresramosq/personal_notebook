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
const MAIN_SPACE_NAME = "Mi tablero";

export function hasLocalWorkspace() {
  return (
    typeof window !== "undefined" &&
    window.localStorage.getItem(STORAGE_KEY) !== null
  );
}

export function createDefaultMainSpace(now = Date.now()): {
  canvas: WorkspaceCanvas;
  activeCanvasId: string;
  cameras: WorkspaceState["cameras"];
} {
  const canvasId = createId();
  return {
    activeCanvasId: canvasId,
    canvas: {
      id: canvasId,
      name: MAIN_SPACE_NAME,
      parentId: null,
      createdAt: now,
      updatedAt: now,
    },
    cameras: { [canvasId]: DEFAULT_CAMERA },
  };
}

export function createInitialWorkspace(): WorkspaceState {
  const now = Date.now();
  const main = createDefaultMainSpace(now);
  return {
    version: 3,
    activeCanvasId: main.activeCanvasId,
    canvases: [main.canvas],
    items: [],
    links: [],
    cameras: main.cameras,
    trash: [],
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
      points: item.points ?? [],
      strokeColor: item.strokeColor ?? "#292929",
      strokeWidth: item.strokeWidth ?? 2,
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
    trash: state.trash ?? [],
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
      kind: object.kind === "board" ? "board" : "note",
      title: object.title ?? "",
      content: object.description ?? "",
      url: "",
      nestedCanvasId: null,
      databaseFields: [],
      databaseRecords: [],
      points: [],
      strokeColor: "#292929",
      strokeWidth: 2,
      x: object.x ?? 120,
      y: object.y ?? 120,
      width: object.width ?? 280,
      height: object.height ?? 190,
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
    trash: [],
    activeCanvasId,
  };
}

export function normalizeWorkspace(state: Partial<WorkspaceState>): WorkspaceState {
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

  if (!canvases.some((canvas) => canvas.parentId === null)) {
    const main = createDefaultMainSpace(now);
    canvases = [main.canvas, ...canvases];
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

  let items = (Array.isArray(state.items) ? state.items : [])
    .filter((item) => canvasIds.has(item.canvasId))
    .map((item) => normalizeItem(item, now, canvasIds));

  canvases = syncNestedCanvasNames(canvases, items);

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

  const trash = (Array.isArray(state.trash) ? state.trash : [])
    .filter((entry) => entry?.item?.id)
    .map((entry) => ({
      item: normalizeItem(entry.item, now, canvasIds),
      deletedAt: entry.deletedAt ?? now,
    }));

  return {
    version: 3,
    canvases,
    items,
    links,
    cameras,
    trash,
    activeCanvasId,
  };
}

function syncNestedCanvasNames(
  canvases: WorkspaceCanvas[],
  items: CanvasItem[],
): WorkspaceCanvas[] {
  const boardByNestedCanvas = new Map<string, CanvasItem>();
  for (const item of items) {
    if (item.kind === "board" && item.nestedCanvasId) {
      boardByNestedCanvas.set(item.nestedCanvasId, item);
    }
  }

  return canvases.map((canvas) => {
    if (!canvas.parentId) return canvas;
    const boardItem = boardByNestedCanvas.get(canvas.id);
    const title = boardItem?.title?.trim();
    if (!title || canvas.name === title) return canvas;
    return { ...canvas, name: title, updatedAt: Date.now() };
  });
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
    points: Array.isArray(item.points)
      ? item.points.filter(
          (point) =>
            typeof point?.x === "number" && typeof point?.y === "number",
        )
      : [],
    strokeColor:
      typeof item.strokeColor === "string" ? item.strokeColor : "#292929",
    strokeWidth:
      typeof item.strokeWidth === "number" ? item.strokeWidth : 2,
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
  if (kind === "board") return "board";
  if (kind === "note") return "note";
  if (kind === "text") return "text";
  if (kind === "link") return "link";
  if (kind === "image") return "image";
  if (kind === "video") return "video";
  if (kind === "file") return "file";
  if (kind === "database") return "database";
  if (kind === "drawing") return "drawing";
  if (kind === "todo") return "todo";
  if (kind === "kanban") return "kanban";
  if (kind === "comment") return "comment";
  if (kind === "line") return "line";
  return "board";
}

function defaultTitle(kind: ItemKind) {
  if (kind === "board") return "Nuevo tablero";
  return "Tablero";
}

function defaultWidth(kind: ItemKind) {
  if (kind === "board") return 200;
  return 260;
}

function defaultHeight(kind: ItemKind) {
  if (kind === "board") return 44;
  return 180;
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

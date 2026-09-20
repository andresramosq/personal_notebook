import type {
  CanvasItem,
  ItemColor,
  ItemKind,
  WorkspaceState,
} from "@/lib/workspace/types";

const STORAGE_KEY = "libreta:workspace:v1";

export function createInitialWorkspace(): WorkspaceState {
  const now = Date.now();
  const canvasId = crypto.randomUUID();

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
      [canvasId]: { x: 0, y: 0, zoom: 1 },
    },
  };
}

export function loadWorkspace(): WorkspaceState {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);

    if (!raw) {
      return createInitialWorkspace();
    }

    const state = JSON.parse(raw) as WorkspaceState | LegacyWorkspace;

    if (state.version === 2) {
      if (!Array.isArray(state.canvases) || !Array.isArray(state.items)) {
        return createInitialWorkspace();
      }
      return state;
    }

    return migrateLegacyWorkspace(state);
  } catch {
    return createInitialWorkspace();
  }
}

export function saveWorkspace(state: WorkspaceState) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

type LegacyWorkspace = {
  version: 1;
  activeSpaceId?: string;
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
  const canvases = legacy.spaces.map((space) => ({
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
              id: row.id,
              text: row.title,
              checked: row.status === "done",
            }))
          : [];

      return {
        id: object.id,
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

  const activeCanvasId = canvasIds.has(legacy.activeSpaceId ?? "")
    ? legacy.activeSpaceId!
    : canvases[0].id;

  return {
    version: 2,
    canvases,
    items,
    cameras: Object.fromEntries(
      canvases.map((canvas) => [canvas.id, { x: 0, y: 0, zoom: 1 }]),
    ),
    activeCanvasId,
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

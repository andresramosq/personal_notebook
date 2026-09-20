import type { WorkspaceState } from "@/lib/workspace/types";

const STORAGE_KEY = "libreta:workspace:v1";

export function createInitialWorkspace(): WorkspaceState {
  const now = Date.now();
  const spaceId = crypto.randomUUID();

  return {
    version: 1,
    activeSpaceId: spaceId,
    spaces: [
      {
        id: spaceId,
        name: "Mi espacio",
        view: "canvas",
        createdAt: now,
      },
    ],
    objects: [],
    links: [],
  };
}

export function loadWorkspace(): WorkspaceState {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);

    if (!raw) {
      return createInitialWorkspace();
    }

    const state = JSON.parse(raw) as WorkspaceState;

    if (
      state.version !== 1 ||
      !Array.isArray(state.spaces) ||
      !Array.isArray(state.objects) ||
      !Array.isArray(state.links)
    ) {
      return createInitialWorkspace();
    }

    return state;
  } catch {
    return createInitialWorkspace();
  }
}

export function saveWorkspace(state: WorkspaceState) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

import "server-only";

import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { createInitialWorkspace } from "@/lib/workspace/storage";
import type {
  CanvasCamera,
  CanvasItem,
  CanvasLink,
  ItemColor,
  ItemKind,
  WorkspaceCanvas,
  WorkspaceState,
} from "@/lib/workspace/types";

const databasePath =
  process.env.LIBRETA_DATABASE_PATH ??
  path.join(process.cwd(), "data", "libreta.db");

fs.mkdirSync(path.dirname(databasePath), { recursive: true });

const globalDatabase = globalThis as typeof globalThis & {
  libretaDatabase?: Database.Database;
};

const db =
  globalDatabase.libretaDatabase ??
  new Database(databasePath, {
    fileMustExist: false,
  });

if (process.env.NODE_ENV !== "production") {
  globalDatabase.libretaDatabase = db;
}

db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");
db.exec(`
  CREATE TABLE IF NOT EXISTS workspace_meta (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS canvases (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    parent_id TEXT REFERENCES canvases(id) ON DELETE CASCADE,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS canvas_items (
    id TEXT PRIMARY KEY,
    canvas_id TEXT NOT NULL REFERENCES canvases(id) ON DELETE CASCADE,
    kind TEXT NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    url TEXT NOT NULL,
    nested_canvas_id TEXT REFERENCES canvases(id) ON DELETE SET NULL,
    x REAL NOT NULL,
    y REAL NOT NULL,
    width REAL NOT NULL,
    height REAL NOT NULL,
    color TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );

  CREATE INDEX IF NOT EXISTS canvas_items_canvas_id
    ON canvas_items(canvas_id);

  CREATE TABLE IF NOT EXISTS canvas_links (
    id TEXT PRIMARY KEY,
    canvas_id TEXT NOT NULL REFERENCES canvases(id) ON DELETE CASCADE,
    from_id TEXT NOT NULL REFERENCES canvas_items(id) ON DELETE CASCADE,
    to_id TEXT NOT NULL REFERENCES canvas_items(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS canvas_links_canvas_id
    ON canvas_links(canvas_id);

  CREATE TABLE IF NOT EXISTS canvas_cameras (
    canvas_id TEXT PRIMARY KEY REFERENCES canvases(id) ON DELETE CASCADE,
    x REAL NOT NULL,
    y REAL NOT NULL,
    zoom REAL NOT NULL
  );
`);

type CanvasRow = {
  id: string;
  name: string;
  parent_id: string | null;
  created_at: number;
  updated_at: number;
};

type ItemRow = {
  id: string;
  canvas_id: string;
  kind: ItemKind;
  title: string;
  content: string;
  url: string;
  nested_canvas_id: string | null;
  x: number;
  y: number;
  width: number;
  height: number;
  color: ItemColor;
  created_at: number;
  updated_at: number;
};

type LinkRow = {
  id: string;
  canvas_id: string;
  from_id: string;
  to_id: string;
};

type CameraRow = {
  canvas_id: string;
  x: number;
  y: number;
  zoom: number;
};

export function readWorkspace(): {
  state: WorkspaceState;
  isNew: boolean;
} {
  const rows = db.prepare("SELECT * FROM canvases").all() as CanvasRow[];

  if (!rows.length) {
    const state = createInitialWorkspace();
    writeWorkspace(state);
    return { state, isNew: true };
  }

  const canvases: WorkspaceCanvas[] = rows.map((row) => ({
    id: row.id,
    name: row.name,
    parentId: row.parent_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));

  const items = (
    db.prepare("SELECT * FROM canvas_items").all() as ItemRow[]
  ).map((row): CanvasItem => ({
    id: row.id,
    canvasId: row.canvas_id,
    kind: row.kind,
    title: row.title,
    content: row.content,
    url: row.url,
    nestedCanvasId: row.nested_canvas_id,
    x: row.x,
    y: row.y,
    width: row.width,
    height: row.height,
    color: row.color,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));

  const links = (
    db.prepare("SELECT * FROM canvas_links").all() as LinkRow[]
  ).map((row): CanvasLink => ({
    id: row.id,
    canvasId: row.canvas_id,
    fromId: row.from_id,
    toId: row.to_id,
  }));

  const cameras = Object.fromEntries(
    (db.prepare("SELECT * FROM canvas_cameras").all() as CameraRow[]).map(
      (row) => [
        row.canvas_id,
        { x: row.x, y: row.y, zoom: row.zoom } satisfies CanvasCamera,
      ],
    ),
  );

  const activeCanvasId =
    (
      db
        .prepare("SELECT value FROM workspace_meta WHERE key = ?")
        .get("active_canvas_id") as { value: string } | undefined
    )?.value ?? canvases[0].id;

  return {
    isNew: false,
    state: {
      version: 3,
      canvases,
      items,
      links,
      cameras,
      activeCanvasId: canvases.some((canvas) => canvas.id === activeCanvasId)
        ? activeCanvasId
        : canvases[0].id,
    },
  };
}

const persistWorkspace = db.transaction((state: WorkspaceState) => {
  db.prepare("DELETE FROM canvas_links").run();
  db.prepare("DELETE FROM canvas_items").run();
  db.prepare("DELETE FROM canvas_cameras").run();
  db.prepare("DELETE FROM canvases").run();
  db.prepare("DELETE FROM workspace_meta").run();

  const insertCanvas = db.prepare(`
    INSERT INTO canvases (id, name, parent_id, created_at, updated_at)
    VALUES (@id, @name, @parentId, @createdAt, @updatedAt)
  `);
  const rootCanvases = state.canvases.filter((canvas) => !canvas.parentId);
  const nestedCanvases = state.canvases.filter((canvas) => canvas.parentId);
  for (const canvas of [...rootCanvases, ...nestedCanvases]) {
    insertCanvas.run(canvas);
  }

  const insertItem = db.prepare(`
    INSERT INTO canvas_items (
      id, canvas_id, kind, title, content, url, nested_canvas_id,
      x, y, width, height, color, created_at, updated_at
    ) VALUES (
      @id, @canvasId, @kind, @title, @content, @url, @nestedCanvasId,
      @x, @y, @width, @height, @color, @createdAt, @updatedAt
    )
  `);
  for (const item of state.items) {
    insertItem.run(item);
  }

  const insertLink = db.prepare(`
    INSERT INTO canvas_links (id, canvas_id, from_id, to_id)
    VALUES (@id, @canvasId, @fromId, @toId)
  `);
  for (const link of state.links) {
    insertLink.run(link);
  }

  const insertCamera = db.prepare(`
    INSERT INTO canvas_cameras (canvas_id, x, y, zoom)
    VALUES (?, ?, ?, ?)
  `);
  for (const canvas of state.canvases) {
    const camera = state.cameras[canvas.id] ?? { x: 0, y: 0, zoom: 1 };
    insertCamera.run(canvas.id, camera.x, camera.y, camera.zoom);
  }

  db.prepare("INSERT INTO workspace_meta (key, value) VALUES (?, ?)").run(
    "active_canvas_id",
    state.activeCanvasId,
  );
});

export function writeWorkspace(state: WorkspaceState) {
  persistWorkspace(state);
}

import "server-only";

import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { createInitialWorkspace } from "@/lib/workspace/storage";
import type {
  CanvasCamera,
  CanvasItem,
  CanvasLink,
  DatabaseField,
  DatabaseFieldType,
  DatabaseRecord,
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

  CREATE TABLE IF NOT EXISTS database_fields (
    id TEXT PRIMARY KEY,
    item_id TEXT NOT NULL REFERENCES canvas_items(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    options_json TEXT NOT NULL,
    position INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS database_records (
    id TEXT PRIMARY KEY,
    item_id TEXT NOT NULL REFERENCES canvas_items(id) ON DELETE CASCADE,
    position INTEGER NOT NULL,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS database_cells (
    record_id TEXT NOT NULL REFERENCES database_records(id) ON DELETE CASCADE,
    field_id TEXT NOT NULL REFERENCES database_fields(id) ON DELETE CASCADE,
    value TEXT NOT NULL,
    PRIMARY KEY (record_id, field_id)
  );

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

ensureColumn("canvas_items", "points_json", 'TEXT NOT NULL DEFAULT "[]"');
ensureColumn("canvas_items", "stroke_color", 'TEXT NOT NULL DEFAULT "#292929"');
ensureColumn("canvas_items", "stroke_width", "REAL NOT NULL DEFAULT 2");

function ensureColumn(table: string, column: string, definition: string) {
  const columns = db
    .prepare(`PRAGMA table_info(${table})`)
    .all() as Array<{ name: string }>;
  if (!columns.some((entry) => entry.name === column)) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  }
}

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
  points_json: string;
  stroke_color: string;
  stroke_width: number;
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

type DatabaseFieldRow = {
  id: string;
  item_id: string;
  name: string;
  type: DatabaseFieldType;
  options_json: string;
  position: number;
};

type DatabaseRecordRow = {
  id: string;
  item_id: string;
  position: number;
  created_at: number;
  updated_at: number;
};

type DatabaseCellRow = {
  record_id: string;
  field_id: string;
  value: string;
};

export function readWorkspace(): {
  state: WorkspaceState;
  isNew: boolean;
} {
  const rows = db.prepare("SELECT * FROM canvases").all() as CanvasRow[];

  if (!rows.length) {
    return { state: createInitialWorkspace(), isNew: true };
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
    databaseFields: [],
    databaseRecords: [],
    points: parseDrawingPoints(row.points_json),
    strokeColor: row.stroke_color ?? "#292929",
    strokeWidth: row.stroke_width ?? 2,
    x: row.x,
    y: row.y,
    width: row.width,
    height: row.height,
    color: row.color,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));

  const databaseFields = (
    db
      .prepare("SELECT * FROM database_fields ORDER BY position")
      .all() as DatabaseFieldRow[]
  ).map(
    (row): DatabaseField & { itemId: string } => ({
      id: row.id,
      itemId: row.item_id,
      name: row.name,
      type: row.type,
      options: JSON.parse(row.options_json) as string[],
    }),
  );
  const fieldsById = new Map(databaseFields.map((field) => [field.id, field]));
  const cellsByRecord = new Map<string, Record<string, string | boolean>>();
  const cellRows = db
    .prepare("SELECT * FROM database_cells")
    .all() as DatabaseCellRow[];

  for (const cell of cellRows) {
    const field = fieldsById.get(cell.field_id);
    const cells = cellsByRecord.get(cell.record_id) ?? {};
    cells[cell.field_id] =
      field?.type === "checkbox" ? cell.value === "1" : cell.value;
    cellsByRecord.set(cell.record_id, cells);
  }

  const databaseRecords = (
    db
      .prepare("SELECT * FROM database_records ORDER BY position")
      .all() as DatabaseRecordRow[]
  ).map(
    (row): DatabaseRecord & { itemId: string } => ({
      id: row.id,
      itemId: row.item_id,
      cells: cellsByRecord.get(row.id) ?? {},
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }),
  );

  for (const item of items) {
    item.databaseFields = databaseFields
      .filter((field) => field.itemId === item.id)
      .map(({ itemId, ...field }) => {
        void itemId;
        return field;
      });
    item.databaseRecords = databaseRecords
      .filter((record) => record.itemId === item.id)
      .map(({ itemId, ...record }) => {
        void itemId;
        return record;
      });
  }

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

  const storedActiveCanvasId =
    (
      db
        .prepare("SELECT value FROM workspace_meta WHERE key = ?")
        .get("active_canvas_id") as { value: string } | undefined
    )?.value ?? "";
  const activeCanvasId = canvases.some(
    (canvas) => canvas.id === storedActiveCanvasId,
  )
    ? storedActiveCanvasId
    : (canvases.find((canvas) => canvas.parentId === null)?.id ??
      canvases[0]?.id ??
      "");

  return {
    isNew: false,
    state: {
      version: 3,
      canvases,
      items,
      links,
      cameras,
      activeCanvasId,
    },
  };
}

const persistWorkspace = db.transaction((state: WorkspaceState) => {
  db.prepare("DELETE FROM canvas_links").run();
  db.prepare("DELETE FROM database_cells").run();
  db.prepare("DELETE FROM database_records").run();
  db.prepare("DELETE FROM database_fields").run();
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
      x, y, width, height, color, points_json, stroke_color, stroke_width,
      created_at, updated_at
    ) VALUES (
      @id, @canvasId, @kind, @title, @content, @url, @nestedCanvasId,
      @x, @y, @width, @height, @color, @pointsJson, @strokeColor, @strokeWidth,
      @createdAt, @updatedAt
    )
  `);
  for (const item of state.items) {
    insertItem.run({
      ...item,
      pointsJson: JSON.stringify(item.points ?? []),
      strokeColor: item.strokeColor ?? "#292929",
      strokeWidth: item.strokeWidth ?? 2,
    });
  }

  const insertField = db.prepare(`
    INSERT INTO database_fields (
      id, item_id, name, type, options_json, position
    ) VALUES (?, ?, ?, ?, ?, ?)
  `);
  const insertRecord = db.prepare(`
    INSERT INTO database_records (
      id, item_id, position, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?)
  `);
  const insertCell = db.prepare(`
    INSERT INTO database_cells (record_id, field_id, value)
    VALUES (?, ?, ?)
  `);
  for (const item of state.items) {
    item.databaseFields.forEach((field, position) => {
      insertField.run(
        field.id,
        item.id,
        field.name,
        field.type,
        JSON.stringify(field.options),
        position,
      );
    });
    item.databaseRecords.forEach((record, position) => {
      insertRecord.run(
        record.id,
        item.id,
        position,
        record.createdAt,
        record.updatedAt,
      );
      for (const [fieldId, value] of Object.entries(record.cells)) {
        insertCell.run(
          record.id,
          fieldId,
          typeof value === "boolean" ? (value ? "1" : "0") : value,
        );
      }
    });
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

function parseDrawingPoints(raw: string | undefined) {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as Array<{ x?: number; y?: number }>;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (point) => typeof point?.x === "number" && typeof point?.y === "number",
      )
      .map((point) => ({ x: point.x!, y: point.y! }));
  } catch {
    return [];
  }
}

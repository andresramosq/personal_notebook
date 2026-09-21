import { createId } from "@/lib/workspace/id";

export type TodoItem = {
  id: string;
  text: string;
  done: boolean;
  indent: number;
  dueDate: string | null;
};

export type KanbanCard = {
  id: string;
  text: string;
};

export type KanbanColumn = {
  id: string;
  title: string;
  cards: KanbanCard[];
};

export type TodoBlock = {
  items: TodoItem[];
};

export type KanbanBlock = {
  columns: KanbanColumn[];
};

export type TableCellType = "text" | "number" | "date" | "checkbox";

export type TableCell = {
  type: TableCellType;
  value: string | boolean;
};

export type TableBlock = {
  rows: number;
  cols: number;
  cells: Record<string, TableCell>;
};

export type CommentMessage = {
  id: string;
  text: string;
  parentId: string | null;
  createdAt: number;
};

export type CommentBlock = {
  messages: CommentMessage[];
};

export type ColumnBlock = {
  collapsed: boolean;
};

export function createDefaultTodoContent() {
  const block: TodoBlock = {
    items: [
      { id: createId(), text: "Nueva tarea", done: false, indent: 0, dueDate: null },
      { id: createId(), text: "Otra tarea", done: false, indent: 0, dueDate: null },
    ],
  };
  return JSON.stringify(block);
}

export function createDefaultKanbanContent() {
  const block: KanbanBlock = {
    columns: [
      { id: createId(), title: "Por hacer", cards: [] },
      { id: createId(), title: "En curso", cards: [] },
      { id: createId(), title: "Hecho", cards: [] },
    ],
  };
  return JSON.stringify(block);
}

export function createDefaultTableContent() {
  const block: TableBlock = { rows: 3, cols: 3, cells: {} };
  for (let row = 0; row < block.rows; row += 1) {
    for (let col = 0; col < block.cols; col += 1) {
      block.cells[`${row}-${col}`] = { type: "text", value: "" };
    }
  }
  return JSON.stringify(block);
}

export function createDefaultCommentContent() {
  const block: CommentBlock = { messages: [] };
  return JSON.stringify(block);
}

export function createDefaultColumnContent() {
  const block: ColumnBlock = { collapsed: false };
  return JSON.stringify(block);
}

export function parseTodoContent(content: string): TodoBlock {
  try {
    const parsed = JSON.parse(content) as TodoBlock;
    if (!Array.isArray(parsed.items)) return { items: [] };
    return {
      items: parsed.items
        .filter((item) => item?.id)
        .map((item) => ({
          id: item.id,
          text: item.text ?? "",
          done: Boolean(item.done),
          indent:
            typeof item.indent === "number"
              ? Math.max(0, Math.min(4, item.indent))
              : 0,
          dueDate: typeof item.dueDate === "string" ? item.dueDate : null,
        })),
    };
  } catch {
    return { items: [] };
  }
}

export function parseKanbanContent(content: string): KanbanBlock {
  try {
    const parsed = JSON.parse(content) as KanbanBlock;
    if (!Array.isArray(parsed.columns)) return { columns: [] };
    return {
      columns: parsed.columns
        .filter((column) => column?.id)
        .map((column) => ({
          id: column.id,
          title: column.title ?? "Columna",
          cards: Array.isArray(column.cards)
            ? column.cards
                .filter((card) => card?.id)
                .map((card) => ({ id: card.id, text: card.text ?? "" }))
            : [],
        })),
    };
  } catch {
    return { columns: [] };
  }
}

export function parseTableContent(content: string): TableBlock {
  try {
    const parsed = JSON.parse(content) as TableBlock;
    if (
      typeof parsed.rows !== "number" ||
      typeof parsed.cols !== "number" ||
      !parsed.cells
    ) {
      return JSON.parse(createDefaultTableContent()) as TableBlock;
    }
    return {
      rows: Math.max(1, parsed.rows),
      cols: Math.max(1, parsed.cols),
      cells: parsed.cells,
    };
  } catch {
    return JSON.parse(createDefaultTableContent()) as TableBlock;
  }
}

export function parseCommentContent(content: string): CommentBlock {
  try {
    const parsed = JSON.parse(content) as CommentBlock;
    if (!Array.isArray(parsed.messages)) return { messages: [] };
    return {
      messages: parsed.messages
        .filter((message) => message?.id && message.text?.trim())
        .map((message) => ({
          id: message.id,
          text: message.text,
          parentId: message.parentId ?? null,
          createdAt: message.createdAt ?? Date.now(),
        })),
    };
  } catch {
    return { messages: [] };
  }
}

export function parseColumnContent(content: string): ColumnBlock {
  try {
    const parsed = JSON.parse(content) as ColumnBlock;
    return { collapsed: Boolean(parsed.collapsed) };
  } catch {
    return { collapsed: false };
  }
}

import { createId } from "@/lib/workspace/id";

export type TodoItem = {
  id: string;
  text: string;
  done: boolean;
  indent: number;
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

export function createDefaultTodoContent() {
  const block: TodoBlock = {
    items: [
      { id: createId(), text: "Nueva tarea", done: false, indent: 0 },
      { id: createId(), text: "Otra tarea", done: false, indent: 0 },
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

export function parseTodoContent(content: string): TodoBlock {
  try {
    const parsed = JSON.parse(content) as TodoBlock;
    if (!Array.isArray(parsed.items)) {
      return { items: [] };
    }
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
        })),
    };
  } catch {
    return { items: [] };
  }
}

export function parseKanbanContent(content: string): KanbanBlock {
  try {
    const parsed = JSON.parse(content) as KanbanBlock;
    if (!Array.isArray(parsed.columns)) {
      return { columns: [] };
    }
    return {
      columns: parsed.columns
        .filter((column) => column?.id)
        .map((column) => ({
          id: column.id,
          title: column.title ?? "Columna",
          cards: Array.isArray(column.cards)
            ? column.cards
                .filter((card) => card?.id)
                .map((card) => ({
                  id: card.id,
                  text: card.text ?? "",
                }))
            : [],
        })),
    };
  } catch {
    return { columns: [] };
  }
}

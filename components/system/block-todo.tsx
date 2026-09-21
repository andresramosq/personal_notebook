"use client";

import { createId } from "@/lib/workspace/id";
import {
  parseTodoContent,
  type TodoBlock,
} from "@/lib/workspace/blocks";

type BlockTodoProps = {
  content: string;
  onChange: (content: string) => void;
};

export function BlockTodo({ content, onChange }: BlockTodoProps) {
  const block = parseTodoContent(content);

  const save = (next: TodoBlock) => {
    onChange(JSON.stringify(next));
  };

  return (
    <div className="block-todo">
      {block.items.map((item) => (
        <label
          key={item.id}
          className="todo-row"
          style={{ paddingLeft: `${item.indent * 18}px` }}
        >
          <input
            type="checkbox"
            checked={item.done}
            onPointerDown={(event) => event.stopPropagation()}
            onChange={() => {
              save({
                items: block.items.map((entry) =>
                  entry.id === item.id
                    ? { ...entry, done: !entry.done }
                    : entry,
                ),
              });
            }}
          />
          <input
            className={item.done ? "is-done" : ""}
            value={item.text}
            onPointerDown={(event) => event.stopPropagation()}
            onChange={(event) => {
              save({
                items: block.items.map((entry) =>
                  entry.id === item.id
                    ? { ...entry, text: event.target.value }
                    : entry,
                ),
              });
            }}
            onKeyDown={(event) => {
              if (event.key !== "Tab") return;
              event.preventDefault();
              const delta = event.shiftKey ? -1 : 1;
              save({
                items: block.items.map((entry) =>
                  entry.id === item.id
                    ? {
                        ...entry,
                        indent: Math.max(
                          0,
                          Math.min(4, entry.indent + delta),
                        ),
                      }
                    : entry,
                ),
              });
            }}
          />
          <input
            type="date"
            className="todo-due"
            value={item.dueDate ?? ""}
            onPointerDown={(event) => event.stopPropagation()}
            onChange={(event) => {
              save({
                items: block.items.map((entry) =>
                  entry.id === item.id
                    ? { ...entry, dueDate: event.target.value || null }
                    : entry,
                ),
              });
            }}
          />
          <button
            type="button"
            className="todo-remove"
            onPointerDown={(event) => event.stopPropagation()}
            onClick={() => {
              save({
                items: block.items.filter((entry) => entry.id !== item.id),
              });
            }}
            aria-label="Quitar tarea"
          >
            ×
          </button>
        </label>
      ))}
      <button
        type="button"
        className="todo-add"
        onPointerDown={(event) => event.stopPropagation()}
        onClick={() => {
          save({
            items: [
              ...block.items,
              {
                id: createId(),
                text: "Nueva tarea",
                done: false,
                indent: 0,
                dueDate: null,
              },
            ],
          });
        }}
      >
        + Añadir tarea
      </button>
    </div>
  );
}

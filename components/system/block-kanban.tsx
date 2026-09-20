"use client";

import { createId } from "@/lib/workspace/id";
import {
  parseKanbanContent,
  type KanbanBlock,
} from "@/lib/workspace/blocks";

type BlockKanbanProps = {
  content: string;
  onChange: (content: string) => void;
};

export function BlockKanban({ content, onChange }: BlockKanbanProps) {
  const block = parseKanbanContent(content);

  const save = (next: KanbanBlock) => {
    onChange(JSON.stringify(next));
  };

  const moveCard = (
    fromColumnId: string,
    cardId: string,
    toColumnId: string,
  ) => {
    let moving: { id: string; text: string } | null = null;
    const without = block.columns.map((column) => {
      const card = column.cards.find((entry) => entry.id === cardId);
      if (card && column.id === fromColumnId) moving = card;
      return {
        ...column,
        cards: column.cards.filter((entry) => entry.id !== cardId),
      };
    });
    if (!moving) return;
    save({
      columns: without.map((column) =>
        column.id === toColumnId
          ? { ...column, cards: [...column.cards, moving!] }
          : column,
      ),
    });
  };

  return (
    <div className="block-kanban">
      {block.columns.map((column) => (
        <div className="kanban-column" key={column.id}>
          <input
            className="kanban-column-title"
            value={column.title}
            onPointerDown={(event) => event.stopPropagation()}
            onChange={(event) => {
              save({
                columns: block.columns.map((entry) =>
                  entry.id === column.id
                    ? { ...entry, title: event.target.value }
                    : entry,
                ),
              });
            }}
          />
          <div className="kanban-cards">
            {column.cards.map((card) => (
              <div className="kanban-card" key={card.id}>
                <input
                  value={card.text}
                  placeholder="Tarjeta"
                  onPointerDown={(event) => event.stopPropagation()}
                  onChange={(event) => {
                    save({
                      columns: block.columns.map((entry) =>
                        entry.id === column.id
                          ? {
                              ...entry,
                              cards: entry.cards.map((candidate) =>
                                candidate.id === card.id
                                  ? { ...candidate, text: event.target.value }
                                  : candidate,
                              ),
                            }
                          : entry,
                      ),
                    });
                  }}
                />
                <div className="kanban-card-actions">
                  {block.columns
                    .filter((entry) => entry.id !== column.id)
                    .map((target) => (
                      <button
                        key={target.id}
                        type="button"
                        title={`Mover a ${target.title}`}
                        onPointerDown={(event) => event.stopPropagation()}
                        onClick={() =>
                          moveCard(column.id, card.id, target.id)
                        }
                      >
                        →
                      </button>
                    ))}
                </div>
              </div>
            ))}
          </div>
          <button
            type="button"
            className="kanban-add-card"
            onPointerDown={(event) => event.stopPropagation()}
            onClick={() => {
              save({
                columns: block.columns.map((entry) =>
                  entry.id === column.id
                    ? {
                        ...entry,
                        cards: [
                          ...entry.cards,
                          { id: createId(), text: "Nueva tarjeta" },
                        ],
                      }
                    : entry,
                ),
              });
            }}
          >
            + Tarjeta
          </button>
        </div>
      ))}
    </div>
  );
}

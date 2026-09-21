"use client";

import {
  parseTableContent,
  type TableBlock,
  type TableCellType,
} from "@/lib/workspace/blocks";

type BlockTableProps = {
  content: string;
  onChange: (content: string) => void;
};

const CELL_TYPES: Array<{ value: TableCellType; label: string }> = [
  { value: "text", label: "Texto" },
  { value: "number", label: "Número" },
  { value: "date", label: "Fecha" },
  { value: "checkbox", label: "Casilla" },
];

export function BlockTable({ content, onChange }: BlockTableProps) {
  const block = parseTableContent(content);

  const save = (next: TableBlock) => {
    onChange(JSON.stringify(next));
  };

  const cellKey = (row: number, col: number) => `${row}-${col}`;

  const getCell = (row: number, col: number) =>
    block.cells[cellKey(row, col)] ?? { type: "text" as const, value: "" };

  const setCell = (
    row: number,
    col: number,
    patch: Partial<{ type: TableCellType; value: string | boolean }>,
  ) => {
    const current = getCell(row, col);
    save({
      ...block,
      cells: {
        ...block.cells,
        [cellKey(row, col)]: { ...current, ...patch },
      },
    });
  };

  const addRow = () => {
    const row = block.rows;
    const cells = { ...block.cells };
    for (let col = 0; col < block.cols; col += 1) {
      cells[cellKey(row, col)] = { type: "text", value: "" };
    }
    save({ ...block, rows: block.rows + 1, cells });
  };

  const addCol = () => {
    const col = block.cols;
    const cells = { ...block.cells };
    for (let row = 0; row < block.rows; row += 1) {
      cells[cellKey(row, col)] = { type: "text", value: "" };
    }
    save({ ...block, cols: block.cols + 1, cells });
  };

  return (
    <div className="block-table">
      <div className="block-table-toolbar">
        <button type="button" onClick={addRow}>
          + Fila
        </button>
        <button type="button" onClick={addCol}>
          + Columna
        </button>
      </div>
      <div
        className="block-table-grid"
        style={{
          gridTemplateColumns: `repeat(${block.cols}, minmax(96px, 1fr))`,
        }}
      >
        {Array.from({ length: block.rows }).map((_, row) =>
          Array.from({ length: block.cols }).map((__, col) => {
            const cell = getCell(row, col);
            return (
              <div key={cellKey(row, col)} className="block-table-cell">
                <select
                  className="block-table-type"
                  value={cell.type}
                  onPointerDown={(event) => event.stopPropagation()}
                  onChange={(event) =>
                    setCell(row, col, {
                      type: event.target.value as TableCellType,
                      value: event.target.value === "checkbox" ? false : "",
                    })
                  }
                >
                  {CELL_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
                {cell.type === "checkbox" ? (
                  <input
                    type="checkbox"
                    checked={Boolean(cell.value)}
                    onPointerDown={(event) => event.stopPropagation()}
                    onChange={(event) =>
                      setCell(row, col, { value: event.target.checked })
                    }
                  />
                ) : (
                  <input
                    className="block-table-value"
                    type={cell.type === "date" ? "date" : cell.type === "number" ? "number" : "text"}
                    value={typeof cell.value === "string" ? cell.value : ""}
                    onPointerDown={(event) => event.stopPropagation()}
                    onChange={(event) =>
                      setCell(row, col, { value: event.target.value })
                    }
                  />
                )}
              </div>
            );
          }),
        )}
      </div>
    </div>
  );
}

export type ColumnDropTarget = {
  columnId: string;
  index: number;
};

/** Detecta columna bajo el cursor y la posición de inserción (línea negra Milanote). */
export function findColumnDrop(
  clientX: number,
  clientY: number,
): ColumnDropTarget | null {
  const element = document.elementFromPoint(clientX, clientY);
  if (!element) return null;

  const body = element.closest("[data-column-body]") as HTMLElement | null;
  if (!body) return null;

  const columnId = body.dataset.columnBody;
  if (!columnId) return null;

  const rows = body.querySelectorAll("[data-column-row]");
  if (!rows.length) return { columnId, index: 0 };

  for (let index = 0; index < rows.length; index += 1) {
    const row = rows[index] as HTMLElement;
    const rect = row.getBoundingClientRect();
    if (clientY < rect.top + rect.height / 2) {
      return { columnId, index };
    }
  }

  return { columnId, index: rows.length };
}

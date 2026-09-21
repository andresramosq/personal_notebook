"use client";

import { Icon } from "@/components/system/icon";
import type { TrashEntry } from "@/lib/workspace/types";

type TrashPanelProps = {
  entries: TrashEntry[];
  onRestore: (itemId: string) => void;
  onPurge: (itemId: string) => void;
  onClose: () => void;
};

export function TrashPanel({
  entries,
  onRestore,
  onPurge,
  onClose,
}: TrashPanelProps) {
  return (
    <div className="trash-overlay" onClick={onClose}>
      <aside
        className="trash-panel"
        onClick={(event) => event.stopPropagation()}
      >
        <header>
          <div>
            <Icon name="trash" size={18} />
            <strong>Papelera</strong>
          </div>
          <button type="button" onClick={onClose} aria-label="Cerrar">
            <Icon name="close" />
          </button>
        </header>
        {!entries.length ? (
          <p className="trash-empty">No hay elementos eliminados.</p>
        ) : (
          <ul className="trash-list">
            {entries.map((entry) => (
              <li key={entry.item.id}>
                <div>
                  <strong>{entry.item.title || labelForKind(entry.item.kind)}</strong>
                  <span>{labelForKind(entry.item.kind)}</span>
                </div>
                <div className="trash-actions">
                  <button type="button" onClick={() => onRestore(entry.item.id)}>
                    Restaurar
                  </button>
                  <button
                    type="button"
                    className="danger"
                    onClick={() => onPurge(entry.item.id)}
                  >
                    Borrar
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </aside>
    </div>
  );
}

function labelForKind(kind: string) {
  const labels: Record<string, string> = {
    note: "Nota",
    text: "Texto",
    link: "Enlace",
    todo: "To-do",
    kanban: "Tablero",
    board: "Tablero",
    video: "Video",
    file: "Archivo",
    comment: "Comentario",
    database: "Tabla",
    image: "Imagen",
    drawing: "Dibujo",
    line: "Línea",
  };
  return labels[kind] ?? kind;
}

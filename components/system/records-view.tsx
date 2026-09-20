"use client";

import type {
  ObjectStatus,
  WorkspaceObject,
} from "@/lib/workspace/types";

type RecordsViewProps = {
  objects: WorkspaceObject[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onUpdate: (id: string, changes: Partial<WorkspaceObject>) => void;
  onCreate: () => void;
};

export function RecordsView({
  objects,
  selectedId,
  onSelect,
  onUpdate,
  onCreate,
}: RecordsViewProps) {
  return (
    <section className="records-view">
      <div className="records-toolbar">
        <span>{objects.length} registros</span>
        <button type="button" onClick={onCreate}>
          + Nuevo registro
        </button>
      </div>
      <div className="records-table-wrap">
        <table className="records-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Estado</th>
              <th>Persona</th>
              <th>Inicio</th>
              <th>Fin</th>
              <th>Etiquetas</th>
            </tr>
          </thead>
          <tbody>
            {objects.map((object) => (
              <tr
                key={object.id}
                className={selectedId === object.id ? "is-selected" : ""}
                onClick={() => onSelect(object.id)}
              >
                <td>
                  <input
                    value={object.title}
                    onChange={(event) =>
                      onUpdate(object.id, { title: event.target.value })
                    }
                  />
                </td>
                <td>
                  <select
                    value={object.status}
                    onChange={(event) =>
                      onUpdate(object.id, {
                        status: event.target.value as ObjectStatus,
                      })
                    }
                  >
                    <option value="inbox">Entrada</option>
                    <option value="active">Activo</option>
                    <option value="waiting">En espera</option>
                    <option value="done">Hecho</option>
                  </select>
                </td>
                <td>{object.person || "—"}</td>
                <td>{object.startDate || "—"}</td>
                <td>{object.endDate || "—"}</td>
                <td>{object.tags.join(", ") || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!objects.length ? (
          <div className="records-empty">
            No hay registros todavía. Crea el primero para empezar.
          </div>
        ) : null}
      </div>
    </section>
  );
}

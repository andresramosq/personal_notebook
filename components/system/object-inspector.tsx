"use client";

import type {
  CustomProperty,
  ObjectStatus,
  WorkspaceObject,
} from "@/lib/workspace/types";

type ObjectInspectorProps = {
  object: WorkspaceObject;
  onUpdate: (changes: Partial<WorkspaceObject>) => void;
  onDelete: () => void;
  onClose: () => void;
};

const COLORS = ["#ffffff", "#fff3bf", "#dff7e7", "#dbeafe", "#f3e8ff"];

export function ObjectInspector({
  object,
  onUpdate,
  onDelete,
  onClose,
}: ObjectInspectorProps) {
  const updateProperty = (
    id: string,
    changes: Partial<CustomProperty>,
  ) => {
    onUpdate({
      properties: object.properties.map((property) =>
        property.id === id ? { ...property, ...changes } : property,
      ),
    });
  };

  return (
    <aside className="inspector">
      <header className="inspector-header">
        <span>Propiedades</span>
        <button type="button" onClick={onClose} aria-label="Cerrar propiedades">
          ×
        </button>
      </header>
      <div className="inspector-content">
        <label className="field">
          <span>Nombre</span>
          <input
            value={object.title}
            onChange={(event) => onUpdate({ title: event.target.value })}
          />
        </label>
        <label className="field">
          <span>Descripción</span>
          <textarea
            rows={4}
            value={object.description}
            onChange={(event) => onUpdate({ description: event.target.value })}
          />
        </label>
        <label className="field">
          <span>Estado</span>
          <select
            value={object.status}
            onChange={(event) =>
              onUpdate({ status: event.target.value as ObjectStatus })
            }
          >
            <option value="inbox">Entrada</option>
            <option value="active">Activo</option>
            <option value="waiting">En espera</option>
            <option value="done">Hecho</option>
          </select>
        </label>
        <div className="field-grid">
          <label className="field">
            <span>Inicio</span>
            <input
              type="date"
              value={object.startDate}
              onChange={(event) => onUpdate({ startDate: event.target.value })}
            />
          </label>
          <label className="field">
            <span>Fin</span>
            <input
              type="date"
              value={object.endDate}
              onChange={(event) => onUpdate({ endDate: event.target.value })}
            />
          </label>
        </div>
        <label className="field">
          <span>Recordatorio</span>
          <input
            type="datetime-local"
            value={object.reminder}
            onChange={(event) => onUpdate({ reminder: event.target.value })}
          />
        </label>
        <label className="field">
          <span>Periodicidad</span>
          <select
            value={object.recurrence}
            onChange={(event) => onUpdate({ recurrence: event.target.value })}
          >
            <option value="">Ninguna</option>
            <option value="daily">Diaria</option>
            <option value="weekly">Semanal</option>
            <option value="monthly">Mensual</option>
          </select>
        </label>
        <label className="field">
          <span>Persona</span>
          <input
            value={object.person}
            placeholder="Nombre"
            onChange={(event) => onUpdate({ person: event.target.value })}
          />
        </label>
        <label className="field">
          <span>Etiquetas</span>
          <input
            value={object.tags.join(", ")}
            placeholder="trabajo, idea, personal"
            onChange={(event) =>
              onUpdate({
                tags: event.target.value
                  .split(",")
                  .map((tag) => tag.trim())
                  .filter(Boolean),
              })
            }
          />
        </label>
        <div className="field">
          <span>Color</span>
          <div className="color-list">
            {COLORS.map((color) => (
              <button
                key={color}
                type="button"
                className={object.color === color ? "is-active" : ""}
                style={{ background: color }}
                onClick={() => onUpdate({ color })}
                aria-label={`Usar color ${color}`}
              />
            ))}
          </div>
        </div>

        <section className="custom-properties">
          <div className="section-heading">
            <span>Propiedades propias</span>
            <button
              type="button"
              onClick={() =>
                onUpdate({
                  properties: [
                    ...object.properties,
                    {
                      id: crypto.randomUUID(),
                      name: "Propiedad",
                      value: "",
                    },
                  ],
                })
              }
            >
              + Añadir
            </button>
          </div>
          {object.properties.map((property) => (
            <div className="custom-property" key={property.id}>
              <input
                value={property.name}
                onChange={(event) =>
                  updateProperty(property.id, { name: event.target.value })
                }
              />
              <input
                value={property.value}
                onChange={(event) =>
                  updateProperty(property.id, { value: event.target.value })
                }
              />
              <button
                type="button"
                onClick={() =>
                  onUpdate({
                    properties: object.properties.filter(
                      (item) => item.id !== property.id,
                    ),
                  })
                }
                aria-label="Eliminar propiedad"
              >
                ×
              </button>
            </div>
          ))}
        </section>
      </div>
      <button type="button" className="danger-button" onClick={onDelete}>
        Eliminar objeto
      </button>
    </aside>
  );
}

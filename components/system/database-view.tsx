"use client";

import { Icon } from "@/components/system/icon";
import { createId } from "@/lib/workspace/id";
import type {
  CanvasItem,
  DatabaseCellValue,
  DatabaseField,
  DatabaseFieldType,
} from "@/lib/workspace/types";

type DatabaseViewProps = {
  item: CanvasItem;
  onUpdate: (changes: Partial<CanvasItem>) => void;
  onClose: () => void;
};

const FIELD_TYPES: Array<{ value: DatabaseFieldType; label: string }> = [
  { value: "text", label: "Texto" },
  { value: "number", label: "Número" },
  { value: "date", label: "Fecha" },
  { value: "select", label: "Selección" },
  { value: "checkbox", label: "Casilla" },
];

export function DatabaseView({ item, onUpdate, onClose }: DatabaseViewProps) {
  const addField = () => {
    const field: DatabaseField = {
      id: createId(),
      name: `Propiedad ${item.databaseFields.length + 1}`,
      type: "text",
      options: [],
    };
    onUpdate({ databaseFields: [...item.databaseFields, field] });
  };

  const updateField = (id: string, changes: Partial<DatabaseField>) => {
    onUpdate({
      databaseFields: item.databaseFields.map((field) =>
        field.id === id ? { ...field, ...changes } : field,
      ),
    });
  };

  const deleteField = (id: string) => {
    onUpdate({
      databaseFields: item.databaseFields.filter((field) => field.id !== id),
      databaseRecords: item.databaseRecords.map((record) => {
        const cells = { ...record.cells };
        delete cells[id];
        return { ...record, cells, updatedAt: Date.now() };
      }),
    });
  };

  const addRecord = () => {
    const now = Date.now();
    const cells = Object.fromEntries(
      item.databaseFields.map((field) => [
        field.id,
        field.type === "checkbox" ? false : "",
      ]),
    );
    onUpdate({
      databaseRecords: [
        ...item.databaseRecords,
        { id: createId(), cells, createdAt: now, updatedAt: now },
      ],
    });
  };

  const updateCell = (
    recordId: string,
    fieldId: string,
    value: DatabaseCellValue,
  ) => {
    onUpdate({
      databaseRecords: item.databaseRecords.map((record) =>
        record.id === recordId
          ? {
              ...record,
              cells: { ...record.cells, [fieldId]: value },
              updatedAt: Date.now(),
            }
          : record,
      ),
    });
  };

  const deleteRecord = (recordId: string) => {
    onUpdate({
      databaseRecords: item.databaseRecords.filter(
        (record) => record.id !== recordId,
      ),
    });
  };

  return (
    <div className="database-overlay" role="dialog" aria-modal="true">
      <section className="database-view">
        <header className="database-view-header">
          <div className="database-view-title">
            <Icon name="database" size={20} />
            <input
              value={item.title}
              onChange={(event) => onUpdate({ title: event.target.value })}
              aria-label="Nombre de la base de datos"
            />
          </div>
          <span>{item.databaseRecords.length} registros</span>
          <button type="button" onClick={onClose} aria-label="Cerrar">
            <Icon name="close" />
          </button>
        </header>

        <div className="database-actions">
          <button type="button" className="primary" onClick={addRecord}>
            <Icon name="plus" size={15} />
            Nuevo registro
          </button>
          <button type="button" onClick={addField}>
            <Icon name="plus" size={15} />
            Propiedad
          </button>
        </div>

        <div className="database-table-wrap">
          <table className="database-table">
            <thead>
              <tr>
                {item.databaseFields.map((field) => (
                  <th key={field.id}>
                    <div className="database-field">
                      <input
                        value={field.name}
                        onChange={(event) =>
                          updateField(field.id, { name: event.target.value })
                        }
                        aria-label="Nombre de propiedad"
                      />
                      <select
                        value={field.type}
                        onChange={(event) =>
                          updateField(field.id, {
                            type: event.target.value as DatabaseFieldType,
                          })
                        }
                        aria-label="Tipo de propiedad"
                      >
                        {FIELD_TYPES.map((type) => (
                          <option key={type.value} value={type.value}>
                            {type.label}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => deleteField(field.id)}
                        aria-label={`Eliminar ${field.name}`}
                      >
                        <Icon name="close" size={13} />
                      </button>
                    </div>
                    {field.type === "select" ? (
                      <input
                        className="database-options-input"
                        value={field.options.join(", ")}
                        placeholder="Opciones separadas por coma"
                        onChange={(event) =>
                          updateField(field.id, {
                            options: event.target.value
                              .split(",")
                              .map((option) => option.trim())
                              .filter(Boolean),
                          })
                        }
                      />
                    ) : null}
                  </th>
                ))}
                <th className="database-row-actions" />
              </tr>
            </thead>
            <tbody>
              {item.databaseRecords.map((record) => (
                <tr key={record.id}>
                  {item.databaseFields.map((field) => (
                    <td key={field.id}>
                      <DatabaseCell
                        field={field}
                        value={record.cells[field.id]}
                        onChange={(value) =>
                          updateCell(record.id, field.id, value)
                        }
                      />
                    </td>
                  ))}
                  <td className="database-row-actions">
                    <button
                      type="button"
                      onClick={() => deleteRecord(record.id)}
                      aria-label="Eliminar registro"
                    >
                      <Icon name="trash" size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {!item.databaseFields.length ? (
            <div className="database-empty">
              Añade una propiedad para empezar.
            </div>
          ) : !item.databaseRecords.length ? (
            <div className="database-empty">
              No hay registros todavía.
              <button type="button" onClick={addRecord}>
                Crear el primero
              </button>
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}

type DatabaseCellProps = {
  field: DatabaseField;
  value: DatabaseCellValue | undefined;
  onChange: (value: DatabaseCellValue) => void;
};

function DatabaseCell({ field, value, onChange }: DatabaseCellProps) {
  if (field.type === "checkbox") {
    return (
      <input
        type="checkbox"
        checked={Boolean(value)}
        onChange={(event) => onChange(event.target.checked)}
        aria-label={field.name}
      />
    );
  }

  if (field.type === "select") {
    return (
      <select
        value={typeof value === "string" ? value : ""}
        onChange={(event) => onChange(event.target.value)}
        aria-label={field.name}
      >
        <option value="">Sin seleccionar</option>
        {field.options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    );
  }

  return (
    <input
      type={field.type}
      value={typeof value === "string" ? value : ""}
      onChange={(event) => onChange(event.target.value)}
      aria-label={field.name}
    />
  );
}

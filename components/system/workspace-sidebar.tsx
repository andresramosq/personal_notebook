"use client";

import { Icon } from "@/components/system/icon";
import type { WorkspaceCanvas } from "@/lib/workspace/types";

type WorkspaceSidebarProps = {
  canvases: WorkspaceCanvas[];
  activeId: string | null;
  open: boolean;
  onClose: () => void;
  onSelect: (id: string) => void;
  onCreate: () => void;
  onDelete: (id: string) => void;
};

export function WorkspaceSidebar({
  canvases,
  activeId,
  open,
  onClose,
  onSelect,
  onCreate,
  onDelete,
}: WorkspaceSidebarProps) {
  return (
    <>
      {open ? (
        <button
          className="sidebar-scrim"
          type="button"
          aria-label="Cerrar menú"
          onClick={onClose}
        />
      ) : null}
      <aside className={`app-sidebar ${open ? "is-open" : ""}`}>
        <div className="sidebar-brand">
          <span className="app-logo">L</span>
          <strong>Libreta</strong>
          <button
            type="button"
            className="mobile-close"
            onClick={onClose}
            aria-label="Cerrar menú"
          >
            <Icon name="close" />
          </button>
        </div>

        <div className="sidebar-heading">
          <span>Espacios</span>
          <button type="button" onClick={onCreate} aria-label="Crear espacio">
            <Icon name="plus" size={16} />
          </button>
        </div>
        <nav className="canvas-list">
          {!canvases.length ? (
            <p className="canvas-list-empty">
              Sin espacios. Pulsa + para crear el primero.
            </p>
          ) : null}
          {canvases.map((canvas) => (
            <div
              key={canvas.id}
              className={`canvas-row ${
                canvas.id === activeId ? "is-active" : ""
              }`}
            >
              <button
                type="button"
                className="canvas-row-main"
                onClick={() => {
                  onSelect(canvas.id);
                  onClose();
                }}
              >
                <Icon name="board" size={16} />
                <span>{canvas.name}</span>
              </button>
              <button
                type="button"
                className="canvas-row-menu"
                onClick={() => {
                  if (
                    window.confirm(
                      `¿Eliminar "${canvas.name}" y todo su contenido?`,
                    )
                  ) {
                    onDelete(canvas.id);
                  }
                }}
                aria-label={`Eliminar ${canvas.name}`}
              >
                <Icon name="trash" size={15} />
              </button>
            </div>
          ))}
        </nav>

        <p className="sidebar-hint">
          Crea espacios para proyectos, ideas o flujos. Usa la barra del lienzo
          para añadir bloques.
        </p>
      </aside>
    </>
  );
}

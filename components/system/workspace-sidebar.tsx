"use client";

import { useMemo, useState } from "react";
import { Icon } from "@/components/system/icon";
import type { WorkspaceCanvas } from "@/lib/workspace/types";

type WorkspaceSidebarProps = {
  canvases: WorkspaceCanvas[];
  activeId: string;
  open: boolean;
  onClose: () => void;
  onSelect: (id: string) => void;
  onCreate: () => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
  onExport: () => void;
};

export function WorkspaceSidebar({
  canvases,
  activeId,
  open,
  onClose,
  onSelect,
  onCreate,
  onDuplicate,
  onDelete,
  onExport,
}: WorkspaceSidebarProps) {
  const [query, setQuery] = useState("");
  const [menuId, setMenuId] = useState<string | null>(null);
  const visibleCanvases = useMemo(() => {
    const value = query.trim().toLocaleLowerCase();
    if (!value) return canvases;
    return canvases.filter((canvas) =>
      canvas.name.toLocaleLowerCase().includes(value),
    );
  }, [canvases, query]);

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

        <label className="sidebar-search">
          <Icon name="search" size={15} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar lienzos"
          />
        </label>

        <div className="sidebar-heading">
          <span>Mis lienzos</span>
          <button type="button" onClick={onCreate} aria-label="Crear lienzo">
            <Icon name="plus" size={16} />
          </button>
        </div>
        <nav className="canvas-list">
          {visibleCanvases.map((canvas) => (
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
                onClick={() =>
                  setMenuId((current) =>
                    current === canvas.id ? null : canvas.id,
                  )
                }
                aria-label={`Opciones de ${canvas.name}`}
              >
                <Icon name="more" size={17} />
              </button>
              {menuId === canvas.id ? (
                <div className="canvas-menu">
                  <button
                    type="button"
                    onClick={() => {
                      onDuplicate(canvas.id);
                      setMenuId(null);
                    }}
                  >
                    <Icon name="copy" size={15} />
                    Duplicar
                  </button>
                  {canvases.length > 1 ? (
                    <button
                      type="button"
                      className="danger"
                      onClick={() => {
                        if (
                          window.confirm(
                            `¿Eliminar "${canvas.name}" y todo su contenido?`,
                          )
                        ) {
                          onDelete(canvas.id);
                          setMenuId(null);
                        }
                      }}
                    >
                      <Icon name="trash" size={15} />
                      Eliminar
                    </button>
                  ) : null}
                </div>
              ) : null}
            </div>
          ))}
          {!visibleCanvases.length ? (
            <p className="sidebar-empty">No hay resultados</p>
          ) : null}
        </nav>

        <div className="sidebar-footer">
          <button type="button" onClick={onExport}>
            <Icon name="download" size={16} />
            Descargar copia
          </button>
          <span>Los cambios se guardan automáticamente.</span>
        </div>
      </aside>
    </>
  );
}

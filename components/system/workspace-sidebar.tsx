"use client";

import type { WorkspaceSpace } from "@/lib/workspace/types";

type WorkspaceSidebarProps = {
  spaces: WorkspaceSpace[];
  activeId: string;
  onSelect: (id: string) => void;
  onCreate: () => void;
  onDelete: (id: string) => void;
};

export function WorkspaceSidebar({
  spaces,
  activeId,
  onSelect,
  onCreate,
  onDelete,
}: WorkspaceSidebarProps) {
  return (
    <aside className="app-sidebar">
      <div className="app-logo">L</div>
      <div className="sidebar-heading">
        <span>Espacios</span>
        <button type="button" onClick={onCreate} aria-label="Crear espacio">
          +
        </button>
      </div>
      <nav className="space-list">
        {spaces.map((space) => (
          <div
            key={space.id}
            className={`space-row ${space.id === activeId ? "is-active" : ""}`}
          >
            <button type="button" onClick={() => onSelect(space.id)}>
              <span className="space-icon">◇</span>
              <span>{space.name}</span>
            </button>
            {spaces.length > 1 ? (
              <button
                type="button"
                className="space-delete"
                onClick={() => onDelete(space.id)}
                aria-label={`Eliminar ${space.name}`}
              >
                ×
              </button>
            ) : null}
          </div>
        ))}
      </nav>
      <div className="sidebar-note">
        <strong>Todo es un objeto</strong>
        <span>Organízalo con propiedades y relaciones.</span>
      </div>
    </aside>
  );
}

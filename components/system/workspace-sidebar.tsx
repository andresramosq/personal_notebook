"use client";

import { Icon } from "@/components/system/icon";
import type {
  CanvasMode,
  PaletteKind,
  WorkspaceCanvas,
} from "@/lib/workspace/types";

const ELEMENTS: Array<{
  kind: PaletteKind;
  icon: "note" | "text" | "image" | "link" | "board" | "line";
  label: string;
}> = [
  { kind: "note", icon: "note", label: "Nota" },
  { kind: "text", icon: "text", label: "Texto" },
  { kind: "image", icon: "image", label: "Imagen" },
  { kind: "link", icon: "link", label: "Enlace" },
  { kind: "board", icon: "board", label: "Pizarra anidada" },
  { kind: "connect", icon: "line", label: "Línea" },
];

type WorkspaceSidebarProps = {
  canvases: WorkspaceCanvas[];
  activeId: string;
  mode: CanvasMode;
  open: boolean;
  onClose: () => void;
  onSelect: (id: string) => void;
  onCreate: () => void;
  onDelete: (id: string) => void;
  onModeChange: (mode: CanvasMode) => void;
};

export function WorkspaceSidebar({
  canvases,
  activeId,
  mode,
  open,
  onClose,
  onSelect,
  onCreate,
  onDelete,
  onModeChange,
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
              {canvases.length > 1 ? (
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
              ) : null}
            </div>
          ))}
        </nav>

        <div className="sidebar-heading sidebar-heading-elements">
          <span>Elementos</span>
        </div>
        <div className="element-palette">
          {ELEMENTS.map((element) => {
            const isConnect = element.kind === "connect";
            const isActive = isConnect && mode === "connect";

            return (
              <button
                key={element.kind}
                type="button"
                className={`palette-item ${isActive ? "is-active" : ""}`}
                draggable={!isConnect}
                onClick={() => {
                  if (isConnect) {
                    onModeChange("connect");
                    return;
                  }
                  onModeChange("select");
                }}
                onDragStart={(event) => {
                  if (isConnect) return;
                  event.dataTransfer.setData(
                    "application/x-libreta-item",
                    element.kind,
                  );
                  event.dataTransfer.setData("text/plain", element.kind);
                  event.dataTransfer.effectAllowed = "copy";
                }}
                title={
                  isConnect
                    ? "Conectar elementos"
                    : `${element.label} · arrastra al lienzo`
                }
              >
                <span className="palette-icon">
                  <Icon name={element.icon} size={17} />
                </span>
                <span>{element.label}</span>
              </button>
            );
          })}
        </div>

        <p className="sidebar-hint">
          Arrastra un elemento al lienzo para colocarlo.
        </p>
      </aside>
    </>
  );
}

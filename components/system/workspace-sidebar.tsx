"use client";

import { Icon } from "@/components/system/icon";
import type {
  CanvasMode,
  PaletteKind,
  WorkspaceCanvas,
} from "@/lib/workspace/types";

const ELEMENTS: Array<{
  kind: PaletteKind;
  icon:
    | "note"
    | "text"
    | "image"
    | "link"
    | "board"
    | "database"
    | "line"
    | "pen";
  label: string;
}> = [
  { kind: "note", icon: "note", label: "Nota" },
  { kind: "text", icon: "text", label: "Texto" },
  { kind: "image", icon: "image", label: "Imagen" },
  { kind: "link", icon: "link", label: "Enlace" },
  { kind: "board", icon: "board", label: "Pizarra anidada" },
  { kind: "database", icon: "database", label: "Base de datos" },
  { kind: "draw", icon: "pen", label: "Dibujo" },
  { kind: "connect", icon: "line", label: "Conectar" },
];

type WorkspaceSidebarProps = {
  canvases: WorkspaceCanvas[];
  activeId: string | null;
  hasActiveCanvas: boolean;
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
  hasActiveCanvas,
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

        <div className="sidebar-heading sidebar-heading-elements">
          <span>Elementos</span>
        </div>
        <div className="element-palette">
          {ELEMENTS.map((element) => {
            const isConnect = element.kind === "connect";
            const isDraw = element.kind === "draw";
            const isTool = isConnect || isDraw;
            const isActive =
              (isConnect && mode === "connect") || (isDraw && mode === "draw");
            const disabled = !hasActiveCanvas && !isTool;

            return (
              <button
                key={element.kind}
                type="button"
                className={`palette-item ${isActive ? "is-active" : ""} ${
                  disabled ? "is-disabled" : ""
                }`}
                draggable={!isTool && hasActiveCanvas}
                disabled={disabled}
                onClick={() => {
                  if (disabled) return;
                  if (isConnect) {
                    onModeChange("connect");
                    return;
                  }
                  if (isDraw) {
                    onModeChange("draw");
                    return;
                  }
                  onModeChange("select");
                }}
                onDragStart={(event) => {
                  if (isTool || !hasActiveCanvas) return;
                  event.dataTransfer.setData(
                    "application/x-libreta-item",
                    element.kind,
                  );
                  event.dataTransfer.setData("text/plain", element.kind);
                  event.dataTransfer.effectAllowed = "copy";
                }}
                title={
                  disabled
                    ? "Crea un espacio primero"
                    : isConnect
                      ? "Conectar dos elementos"
                      : isDraw
                        ? "Dibujar trazos libres"
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
          {hasActiveCanvas
            ? "Arrastra elementos al lienzo. Usa Dibujo o Conectar para trazos y líneas."
            : "Empieza creando un espacio. Después podrás añadir lo que quieras."}
        </p>
      </aside>
    </>
  );
}

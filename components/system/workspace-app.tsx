"use client";

import { useEffect, useState } from "react";
import { CanvasView } from "@/components/system/canvas-view";
import { useWorkspace } from "@/hooks/use-workspace";
import type { CanvasMode } from "@/lib/workspace/types";

export function WorkspaceApp() {
  const workspace = useWorkspace();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mode, setMode] = useState<CanvasMode>("select");

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const editing =
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement;

      if (!editing && event.key.toLowerCase() === "v") setMode("select");
      if (!editing && event.key.toLowerCase() === "h") setMode("hand");
      if (event.key === "Escape") {
        setSelectedId(null);
        setMode("select");
      }
      if (
        !editing &&
        selectedId &&
        (event.key === "Delete" || event.key === "Backspace")
      ) {
        workspace.deleteItem(selectedId);
        setSelectedId(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedId, workspace]);

  if (!workspace.state || !workspace.activeCanvas) {
    return <main className="system-loading">Abriendo Libreta…</main>;
  }

  const camera = workspace.state.cameras[workspace.activeCanvas.id] ?? {
    x: 0,
    y: 0,
    zoom: 1,
  };

  const isMainBoard = workspace.activeCanvas.parentId === null;

  return (
    <main className="system-shell system-shell-minimal">
      <header className="system-header">
        <div className="canvas-heading">
          {workspace.parentCanvas ? (
            <button
              type="button"
              className="breadcrumb-back"
              onClick={workspace.goToParentCanvas}
            >
              ← {workspace.parentCanvas.name}
            </button>
          ) : null}
          <input
            value={workspace.activeCanvas.name}
            onChange={(event) => workspace.renameCanvas(event.target.value)}
            aria-label="Nombre del tablero"
          />
          <span className="board-kind-label">
            {isMainBoard ? "Pizarra principal" : "Pizarra anidada"}
          </span>
        </div>

        <div
          className={`database-status is-${workspace.persistenceStatus}`}
          title="Persistencia SQLite"
        >
          <span />
          {workspace.persistenceStatus === "loading" ||
          workspace.persistenceStatus === "saving"
            ? "Guardando…"
            : workspace.persistenceStatus === "error"
              ? "Sin conexión"
              : "Guardado"}
        </div>
      </header>

      <section className="system-content">
        <CanvasView
          key={workspace.activeCanvas.id}
          items={workspace.items}
          camera={camera}
          selectedId={selectedId}
          mode={mode}
          onModeChange={setMode}
          onCameraChange={workspace.updateCamera}
          onSelect={setSelectedId}
          onCreate={workspace.createItem}
          onUpdate={workspace.updateItem}
          onDelete={workspace.deleteItem}
          onDuplicate={(id) => {
            const nextId = workspace.duplicateItem(id);
            setSelectedId(nextId);
            return nextId;
          }}
          onEnterBoard={(item) => {
            if (item.nestedCanvasId) {
              setSelectedId(null);
              workspace.enterCanvas(item.nestedCanvasId);
            }
          }}
          getNestedPreview={workspace.getNestedPreview}
        />
      </section>
    </main>
  );
}

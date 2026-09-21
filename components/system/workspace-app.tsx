"use client";

import { useEffect, useState } from "react";
import { CanvasView } from "@/components/system/canvas-view";
import { Icon } from "@/components/system/icon";
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

  const path = workspace.canvasPath;
  const ancestors = path.slice(0, -1);
  const canGoBack = ancestors.length > 0;

  return (
    <main className="system-shell system-shell-minimal">
      <header className="system-header board-header">
        {canGoBack ? (
          <button
            type="button"
            className="board-header-back"
            onClick={workspace.goToParentCanvas}
            aria-label="Volver al tablero anterior"
          >
            <Icon name="chevron" size={18} />
          </button>
        ) : null}

        <nav className="board-header-path" aria-label="Ruta del tablero">
          {ancestors.map((canvas) => (
            <span key={canvas.id} className="board-header-crumb">
              <span>{canvas.name}</span>
              <span className="board-header-sep">/</span>
            </span>
          ))}
          <input
            className="board-header-name"
            value={workspace.activeCanvas.name}
            onChange={(event) => workspace.renameCanvas(event.target.value)}
            aria-label="Nombre del tablero actual"
          />
        </nav>
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

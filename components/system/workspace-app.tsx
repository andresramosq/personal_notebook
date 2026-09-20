"use client";

import { useEffect, useState } from "react";
import { CanvasView } from "@/components/system/canvas-view";
import { Icon } from "@/components/system/icon";
import { WorkspaceSidebar } from "@/components/system/workspace-sidebar";
import { useWorkspace } from "@/hooks/use-workspace";
import type { CanvasMode } from "@/lib/workspace/types";

export function WorkspaceApp() {
  const workspace = useWorkspace();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mode, setMode] = useState<CanvasMode>("select");
  const [sidebarOpen, setSidebarOpen] = useState(false);

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

  return (
    <main className="system-shell">
      <WorkspaceSidebar
        canvases={workspace.state.canvases}
        activeId={workspace.activeCanvas.id}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onSelect={(id) => {
          setSelectedId(null);
          workspace.setActiveCanvas(id);
        }}
        onCreate={() => {
          setSelectedId(null);
          workspace.createCanvas();
        }}
        onDuplicate={(id) => {
          setSelectedId(null);
          workspace.duplicateCanvas(id);
        }}
        onDelete={(id) => {
          setSelectedId(null);
          workspace.deleteCanvas(id);
        }}
        onExport={workspace.exportWorkspace}
      />

      <header className="system-header">
        <button
          type="button"
          className="sidebar-toggle"
          onClick={() => setSidebarOpen(true)}
          aria-label="Abrir lienzos"
        >
          <Icon name="menu" />
        </button>
        <div className="canvas-heading">
          <input
            value={workspace.activeCanvas.name}
            onChange={(event) => workspace.renameCanvas(event.target.value)}
            aria-label="Nombre del lienzo"
          />
          <span>{workspace.items.length} elementos</span>
        </div>
        <div className="save-status">
          <span />
          Guardado
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
          onDuplicate={workspace.duplicateItem}
          onDelete={workspace.deleteItem}
        />
      </section>
    </main>
  );
}

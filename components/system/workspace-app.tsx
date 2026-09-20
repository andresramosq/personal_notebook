"use client";

import { useEffect, useMemo, useState } from "react";
import { CanvasView } from "@/components/system/canvas-view";
import { Icon } from "@/components/system/icon";
import { WorkspaceSidebar } from "@/components/system/workspace-sidebar";
import { useWorkspace } from "@/hooks/use-workspace";
import type { CanvasMode } from "@/lib/workspace/types";

export function WorkspaceApp() {
  const workspace = useWorkspace();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [linkSourceId, setLinkSourceId] = useState<string | null>(null);
  const [mode, setMode] = useState<CanvasMode>("select");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [query, setQuery] = useState("");

  const deleteItem = workspace.deleteItem;
  const resetWorkspace = workspace.resetWorkspace;

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const editing =
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement;

      if (!editing && event.key.toLowerCase() === "v") setMode("select");
      if (!editing && event.key.toLowerCase() === "h") setMode("hand");
      if (event.key === "Escape") {
        setSelectedId(null);
        setLinkSourceId(null);
        setMode("select");
      }
      if (
        !editing &&
        selectedId &&
        (event.key === "Delete" || event.key === "Backspace")
      ) {
        deleteItem(selectedId);
        setSelectedId(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [deleteItem, selectedId]);

  const visibleItems = useMemo(() => {
    const value = query.trim().toLocaleLowerCase();
    if (!value) return workspace.items;
    return workspace.items.filter((item) =>
      [item.title, item.content, item.url]
        .join(" ")
        .toLocaleLowerCase()
        .includes(value),
    );
  }, [query, workspace.items]);

  if (!workspace.state) {
    return <main className="system-loading">Abriendo Libreta…</main>;
  }

  if (!workspace.activeCanvas) {
    return (
      <main className="system-loading">
        <p>No se pudo abrir tu lienzo guardado.</p>
        <button type="button" onClick={resetWorkspace}>
          Empezar de nuevo
        </button>
      </main>
    );
  }

  const camera = workspace.state.cameras[workspace.activeCanvas.id] ?? {
    x: 0,
    y: 0,
    zoom: 1,
  };

  const handleLink = (targetId: string) => {
    if (!linkSourceId) {
      setLinkSourceId(targetId);
      setSelectedId(targetId);
      return;
    }
    if (linkSourceId !== targetId) {
      workspace.createLink(linkSourceId, targetId);
    }
    setLinkSourceId(null);
    setSelectedId(targetId);
    setMode("select");
  };

  return (
    <main className="system-shell">
      <WorkspaceSidebar
        canvases={workspace.rootCanvases}
        activeId={workspace.activeCanvas.id}
        mode={mode}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onSelect={(id) => {
          setSelectedId(null);
          setLinkSourceId(null);
          workspace.setActiveCanvas(id);
        }}
        onCreate={() => {
          setSelectedId(null);
          workspace.createCanvas();
        }}
        onDelete={workspace.deleteCanvas}
        onModeChange={(next) => {
          setMode(next);
          if (next !== "connect") setLinkSourceId(null);
        }}
      />

      <header className="system-header">
        <button
          type="button"
          className="sidebar-toggle"
          onClick={() => setSidebarOpen(true)}
          aria-label="Abrir menú"
        >
          <Icon name="menu" />
        </button>

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
            aria-label="Nombre del lienzo"
          />
        </div>

        <label className="search-box">
          <Icon name="search" size={15} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar en este lienzo"
          />
        </label>
      </header>

      <section className="system-content">
        <CanvasView
          key={workspace.activeCanvas.id}
          items={visibleItems}
          links={workspace.links}
          camera={camera}
          selectedId={selectedId}
          linkSourceId={linkSourceId}
          mode={mode}
          onModeChange={setMode}
          onCameraChange={workspace.updateCamera}
          onSelect={setSelectedId}
          onLink={handleLink}
          onDeleteLink={workspace.deleteLink}
          onCreate={workspace.createItem}
          onUpdate={workspace.updateItem}
          onDelete={workspace.deleteItem}
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

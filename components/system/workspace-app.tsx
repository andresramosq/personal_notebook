"use client";

import { useEffect, useMemo, useState } from "react";
import { CanvasView } from "@/components/system/canvas-view";
import { DatabaseView } from "@/components/system/database-view";
import { Icon } from "@/components/system/icon";
import { TrashPanel } from "@/components/system/trash-panel";
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
  const [openDatabaseId, setOpenDatabaseId] = useState<string | null>(null);
  const [trashOpen, setTrashOpen] = useState(false);

  const deleteItem = workspace.deleteItem;
  const hasActiveCanvas = Boolean(workspace.activeCanvas);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const editing =
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement;

      if (!editing && event.key.toLowerCase() === "v") setMode("select");
      if (!editing && event.key.toLowerCase() === "h") setMode("hand");
      if (!editing && event.key.toLowerCase() === "d") setMode("draw");
      if (!editing && event.key.toLowerCase() === "c") {
        setMode("connect");
        setLinkSourceId(null);
      }
      if (event.key === "Escape") {
        if (openDatabaseId) {
          setOpenDatabaseId(null);
          return;
        }
        setSelectedId(null);
        setLinkSourceId(null);
        setMode("select");
      }
      if (
        !editing &&
        hasActiveCanvas &&
        selectedId &&
        (event.key === "Delete" || event.key === "Backspace")
      ) {
        deleteItem(selectedId);
        setSelectedId(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [deleteItem, hasActiveCanvas, openDatabaseId, selectedId]);

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

  const handleCreateCanvas = () => {
    setSelectedId(null);
    setLinkSourceId(null);
    setOpenDatabaseId(null);
    setMode("select");
    workspace.createCanvas();
  };

  const openDatabase = workspace.items.find(
    (item) => item.id === openDatabaseId && item.kind === "database",
  );

  const camera = workspace.activeCanvas
    ? (workspace.state.cameras[workspace.activeCanvas.id] ?? {
        x: 0,
        y: 0,
        zoom: 1,
      })
    : { x: 0, y: 0, zoom: 1 };

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
        activeId={workspace.activeCanvas?.id ?? null}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onSelect={(id) => {
          setSelectedId(null);
          setLinkSourceId(null);
          workspace.setActiveCanvas(id);
        }}
        onCreate={handleCreateCanvas}
        onDelete={workspace.deleteCanvas}
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
          {workspace.activeCanvas && workspace.parentCanvas ? (
            <button
              type="button"
              className="breadcrumb-back"
              onClick={workspace.goToParentCanvas}
            >
              ← {workspace.parentCanvas.name}
            </button>
          ) : null}
          {workspace.activeCanvas ? (
            <input
              value={workspace.activeCanvas.name}
              onChange={(event) => workspace.renameCanvas(event.target.value)}
              aria-label="Nombre del lienzo"
            />
          ) : (
            <strong className="app-title">Libreta</strong>
          )}
        </div>

        {workspace.activeCanvas ? (
          <label className="search-box">
            <Icon name="search" size={15} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar en este lienzo"
            />
          </label>
        ) : null}

        <div
          className={`database-status is-${workspace.persistenceStatus}`}
          title={
            workspace.persistenceStatus === "error"
              ? "La base de datos no respondió. Se conservó una copia local."
              : "Persistencia SQLite"
          }
        >
          <span />
          {workspace.persistenceStatus === "loading"
            ? "BD · Conectando"
            : workspace.persistenceStatus === "saving"
              ? "BD · Guardando"
              : workspace.persistenceStatus === "error"
                ? "BD sin conexión"
                : "BD · Guardado"}
        </div>
      </header>

      <section className="system-content">
        {workspace.activeCanvas ? (
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
          onCreateDrawing={workspace.createDrawing}
          onCreateLine={workspace.createLine}
          trashCount={workspace.trash.length}
          onOpenTrash={() => setTrashOpen(true)}
          onUpdate={workspace.updateItem}
            onDelete={workspace.deleteItem}
            onDuplicate={(id) => {
              const nextId = workspace.duplicateItem(id);
              setSelectedId(nextId);
              return nextId;
            }}
            onConnectStart={setLinkSourceId}
            onEnterBoard={(item) => {
              if (item.nestedCanvasId) {
                setSelectedId(null);
                setOpenDatabaseId(null);
                workspace.enterCanvas(item.nestedCanvasId);
              }
            }}
            onOpenDatabase={(item) => {
              setSelectedId(item.id);
              setOpenDatabaseId(item.id);
            }}
            getNestedPreview={workspace.getNestedPreview}
          />
        ) : (
          <div className="workspace-welcome">
            <div className="workspace-welcome-card">
              <span className="app-logo">L</span>
              <h1>Tu libreta está vacía</h1>
              <p>
                No hay espacios todavía. Crea uno cuando quieras y organiza
                notas, pizarras, bases de datos y dibujos a tu manera.
              </p>
              <button type="button" onClick={handleCreateCanvas}>
                <Icon name="plus" size={16} />
                Crear mi primer espacio
              </button>
            </div>
          </div>
        )}
      </section>

      {openDatabase ? (
        <DatabaseView
          item={openDatabase}
          onUpdate={(changes) => workspace.updateItem(openDatabase.id, changes)}
          onClose={() => setOpenDatabaseId(null)}
        />
      ) : null}

      {trashOpen ? (
        <TrashPanel
          entries={workspace.trash}
          onRestore={(itemId) => workspace.restoreFromTrash(itemId)}
          onPurge={(itemId) => workspace.purgeFromTrash(itemId)}
          onClose={() => setTrashOpen(false)}
        />
      ) : null}
    </main>
  );
}

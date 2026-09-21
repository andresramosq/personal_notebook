"use client";

import { useEffect, useMemo, useState } from "react";
import { CanvasView } from "@/components/system/canvas-view";
import { DatabaseView } from "@/components/system/database-view";
import { Icon } from "@/components/system/icon";
import { TrashPanel } from "@/components/system/trash-panel";
import { UnsortedPanel } from "@/components/system/unsorted-panel";
import { useWorkspace } from "@/hooks/use-workspace";
import type { CanvasMode } from "@/lib/workspace/types";

export function WorkspaceApp() {
  const workspace = useWorkspace();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [linkSourceId, setLinkSourceId] = useState<string | null>(null);
  const [mode, setMode] = useState<CanvasMode>("select");
  const [query, setQuery] = useState("");
  const [openDatabaseId, setOpenDatabaseId] = useState<string | null>(null);
  const [trashOpen, setTrashOpen] = useState(false);
  const [unsortedOpen, setUnsortedOpen] = useState(false);

  const deleteItem = workspace.deleteItem;

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
        selectedId &&
        (event.key === "Delete" || event.key === "Backspace")
      ) {
        deleteItem(selectedId);
        setSelectedId(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [deleteItem, openDatabaseId, selectedId]);

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

  if (!workspace.state || !workspace.activeCanvas) {
    return <main className="system-loading">Abriendo Libreta…</main>;
  }

  const openDatabase = workspace.items.find(
    (item) => item.id === openDatabaseId && item.kind === "database",
  );

  const camera = workspace.state.cameras[workspace.activeCanvas.id] ?? {
    x: 0,
    y: 0,
    zoom: 1,
  };

  const path = workspace.canvasPath;
  const ancestors = path.slice(0, -1);
  const currentSegment = path[path.length - 1];
  const canGoBack = ancestors.length > 0;

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
          {ancestors.map((segment) => (
            <span key={segment.id} className="board-header-crumb">
              <span>{segment.name}</span>
              <span className="board-header-sep">/</span>
            </span>
          ))}
          <input
            className="board-header-name"
            value={currentSegment?.name ?? workspace.activeCanvas.name}
            onChange={(event) => workspace.renameCanvas(event.target.value)}
            aria-label="Nombre del tablero actual"
          />
        </nav>

        <label className="search-box board-header-search">
          <Icon name="search" size={15} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar en este tablero"
          />
        </label>

        <button
          type="button"
          className="unsorted-toggle"
          onClick={() => setUnsortedOpen((open) => !open)}
        >
          Sin clasificar
          {workspace.unsortedItems.length ? (
            <span className="unsorted-toggle-count">
              {workspace.unsortedItems.length}
            </span>
          ) : null}
        </button>
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
          onCreateUploaded={workspace.createUploadedItem}
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
              setLinkSourceId(null);
              workspace.enterCanvas(item.nestedCanvasId);
            }
          }}
          onOpenDatabase={(item) => {
            setSelectedId(item.id);
            setOpenDatabaseId(item.id);
          }}
        />
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

      <UnsortedPanel
        open={unsortedOpen}
        items={workspace.unsortedItems}
        onClose={() => setUnsortedOpen(false)}
        onDragItem={(itemId, event) => {
          event.dataTransfer.setData(
            "application/x-libreta-unsorted-item",
            itemId,
          );
          event.dataTransfer.effectAllowed = "move";
        }}
      />
    </main>
  );
}

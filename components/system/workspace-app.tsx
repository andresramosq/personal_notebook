"use client";

import { useMemo, useState } from "react";
import { CanvasView } from "@/components/system/canvas-view";
import { ObjectInspector } from "@/components/system/object-inspector";
import { RecordsView } from "@/components/system/records-view";
import { WorkspaceSidebar } from "@/components/system/workspace-sidebar";
import { useWorkspace } from "@/hooks/use-workspace";

export function WorkspaceApp() {
  const workspace = useWorkspace();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [linkSourceId, setLinkSourceId] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const selected = workspace.objects.find(
    (object) => object.id === selectedId,
  );

  const visibleObjects = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return workspace.objects;

    return workspace.objects.filter((object) =>
      [
        object.title,
        object.description,
        object.person,
        object.tags.join(" "),
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalized),
    );
  }, [query, workspace.objects]);

  if (!workspace.state || !workspace.activeSpace) {
    return <main className="system-loading">Preparando tu espacio…</main>;
  }

  const createObject = (position?: { x: number; y: number }) => {
    const id = workspace.createObject(position);
    setSelectedId(id);
  };

  return (
    <main className="system-shell">
      <WorkspaceSidebar
        spaces={workspace.state.spaces}
        activeId={workspace.state.activeSpaceId}
        onSelect={(id) => {
          setSelectedId(null);
          setLinkSourceId(null);
          workspace.setActiveSpace(id);
        }}
        onCreate={() => {
          setSelectedId(null);
          setLinkSourceId(null);
          workspace.createSpace();
        }}
        onDelete={(id) => {
          setSelectedId(null);
          setLinkSourceId(null);
          workspace.deleteSpace(id);
        }}
      />

      <header className="system-header">
        <input
          className="space-title-input"
          value={workspace.activeSpace.name}
          onChange={(event) =>
            workspace.updateSpace({ name: event.target.value })
          }
          aria-label="Nombre del espacio"
        />
        <div className="view-switcher">
          <button
            type="button"
            className={
              workspace.activeSpace.view === "canvas" ? "is-active" : ""
            }
            onClick={() => workspace.updateSpace({ view: "canvas" })}
          >
            Lienzo
          </button>
          <button
            type="button"
            className={
              workspace.activeSpace.view === "records" ? "is-active" : ""
            }
            onClick={() => workspace.updateSpace({ view: "records" })}
          >
            Registros
          </button>
        </div>
        <label className="search-box">
          <span>⌕</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar objetos"
          />
        </label>
        <button
          type="button"
          className="header-action"
          onClick={() => createObject()}
        >
          + Objeto
        </button>
        <button
          type="button"
          className={`header-action secondary ${
            linkSourceId ? "is-active" : ""
          }`}
          disabled={!selectedId}
          onClick={() =>
            setLinkSourceId((current) => (current ? null : selectedId))
          }
        >
          {linkSourceId ? "Cancelar" : "Conectar"}
        </button>
      </header>

      <section
        className={`system-content ${selected ? "with-inspector" : ""}`}
      >
        {workspace.activeSpace.view === "canvas" ? (
          <CanvasView
            objects={visibleObjects}
            links={workspace.links}
            selectedId={selectedId}
            linkSourceId={linkSourceId}
            onSelect={setSelectedId}
            onMove={(id, x, y) => workspace.updateObject(id, { x, y })}
            onCreate={createObject}
            onLinkObject={(targetId) => {
              if (linkSourceId && targetId !== linkSourceId) {
                workspace.createLink(linkSourceId, targetId);
                setLinkSourceId(null);
                setSelectedId(targetId);
              }
            }}
            onDeleteLink={workspace.deleteLink}
          />
        ) : (
          <RecordsView
            objects={visibleObjects}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onUpdate={workspace.updateObject}
            onCreate={() => createObject()}
          />
        )}

        {selected ? (
          <ObjectInspector
            object={selected}
            onUpdate={(changes) =>
              workspace.updateObject(selected.id, changes)
            }
            onDelete={() => {
              workspace.deleteObject(selected.id);
              setSelectedId(null);
              setLinkSourceId(null);
            }}
            onClose={() => setSelectedId(null)}
          />
        ) : null}
      </section>
    </main>
  );
}

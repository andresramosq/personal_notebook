"use client";

import { useEffect, useMemo, useState } from "react";
import { CanvasView } from "@/components/system/canvas-view";
import { ObjectInspector } from "@/components/system/object-inspector";
import { RecordsView } from "@/components/system/records-view";
import { WorkspaceSidebar } from "@/components/system/workspace-sidebar";
import { useWorkspace } from "@/hooks/use-workspace";
import type {
  CanvasTool,
  DrawingPoint,
  ObjectKind,
} from "@/lib/workspace/types";

export function WorkspaceApp() {
  const workspace = useWorkspace();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [linkSourceId, setLinkSourceId] = useState<string | null>(null);
  const [activeTool, setActiveTool] = useState<CanvasTool>("select");
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

  useEffect(() => {
    const shortcuts: Record<string, CanvasTool> = {
      v: "select",
      h: "hand",
      d: "draw",
      r: "rectangle",
      o: "ellipse",
      t: "text",
      n: "note",
      p: "page",
      b: "database",
      c: "connect",
    };
    const handler = (event: KeyboardEvent) => {
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement ||
        event.target instanceof HTMLSelectElement
      )
        return;
      const tool = shortcuts[event.key.toLowerCase()];
      if (tool) setActiveTool(tool);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  if (!workspace.state || !workspace.activeSpace) {
    return <main className="system-loading">Preparando tu espacio…</main>;
  }

  const createObject = (
    position?: { x: number; y: number },
    kind: ObjectKind = "card",
    size?: { width: number; height: number },
    points?: DrawingPoint[],
  ) => {
    const id = workspace.createObject(position, kind, size, points);
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
          onClick={() => createObject(undefined, "card")}
        >
          + Objeto
        </button>
        <button
          type="button"
          className={`header-action secondary ${
            activeTool === "connect" ? "is-active" : ""
          }`}
          disabled={!selectedId}
          onClick={() => {
            setLinkSourceId(selectedId);
            setActiveTool("connect");
          }}
        >
          Conectar
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
            activeTool={activeTool}
            onToolChange={(tool) => {
              setActiveTool(tool);
              if (tool !== "connect") setLinkSourceId(null);
              if (tool === "connect" && selectedId)
                setLinkSourceId(selectedId);
            }}
            onSelect={setSelectedId}
            onMove={(id, x, y) => workspace.updateObject(id, { x, y })}
            onResize={(id, width, height) =>
              workspace.updateObject(id, { width, height })
            }
            onUpdate={workspace.updateObject}
            onCreate={createObject}
            onLinkObject={(targetId) => {
              if (!linkSourceId) {
                setLinkSourceId(targetId);
                setSelectedId(targetId);
              } else if (targetId !== linkSourceId) {
                workspace.createLink(linkSourceId, targetId);
                setLinkSourceId(null);
                setSelectedId(targetId);
                setActiveTool("select");
              }
            }}
            onDeleteLink={workspace.deleteLink}
          />
        ) : (
          <RecordsView
            objects={visibleObjects.filter(
              (object) =>
                !["drawing", "rectangle", "ellipse"].includes(object.kind),
            )}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onUpdate={workspace.updateObject}
            onCreate={() => createObject(undefined, "card")}
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

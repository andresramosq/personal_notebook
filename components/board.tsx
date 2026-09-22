"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { NoteCard } from "@/components/note-card";
import { createId } from "@/lib/id";
import type { BoardState, Note } from "@/lib/types";

const STORAGE_KEY = "libreta:board:v1";
const DEFAULT_STATE: BoardState = { notes: [] };

function loadBoard(): BoardState {
  if (typeof window === "undefined") return DEFAULT_STATE;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STATE;
    const parsed = JSON.parse(raw) as BoardState;
    if (!Array.isArray(parsed.notes)) return DEFAULT_STATE;
    return parsed;
  } catch {
    return DEFAULT_STATE;
  }
}

function getInitialNotes() {
  return loadBoard().notes;
}

export function Board() {
  const viewportRef = useRef<HTMLDivElement>(null);
  const skipSaveRef = useRef(true);
  const [notes, setNotes] = useState<Note[]>(getInitialNotes);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [placing, setPlacing] = useState(false);
  const [camera, setCamera] = useState({ x: 0, y: 0, zoom: 1 });
  const cameraRef = useRef(camera);

  useEffect(() => {
    if (skipSaveRef.current) {
      skipSaveRef.current = false;
      return;
    }
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ notes }));
  }, [notes]);

  useEffect(() => {
    cameraRef.current = camera;
  }, [camera]);

  const toWorld = useCallback((clientX: number, clientY: number) => {
    const rect = viewportRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    const current = cameraRef.current;
    return {
      x: (clientX - rect.left - current.x) / current.zoom,
      y: (clientY - rect.top - current.y) / current.zoom,
    };
  }, []);

  const addNoteAt = (clientX: number, clientY: number) => {
    const point = toWorld(clientX, clientY);
    const note: Note = {
      id: createId(),
      x: point.x - 120,
      y: point.y - 60,
      content: "",
    };
    setNotes((current) => [...current, note]);
    setSelectedId(note.id);
    setPlacing(false);
  };

  const startPan = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.button !== 1) return;
    event.preventDefault();
    setSelectedId(null);

    const start = { x: event.clientX, y: event.clientY };
    const origin = cameraRef.current;

    const move = (moveEvent: PointerEvent) => {
      setCamera({
        ...origin,
        x: origin.x + moveEvent.clientX - start.x,
        y: origin.y + moveEvent.clientY - start.y,
      });
    };

    const stop = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", stop);
    };

    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", stop, { once: true });
  };

  return (
    <div className="board-shell">
      <header className="board-header">
        <h1>Tablero</h1>
        <div className="board-toolbar">
          <button
            type="button"
            className={placing ? "is-active" : ""}
            onClick={() => {
              setPlacing((current) => !current);
              setSelectedId(null);
            }}
          >
            {placing ? "Clic en el tablero…" : "Nota"}
          </button>
        </div>
      </header>

      <div
        ref={viewportRef}
        className={`board-viewport ${placing ? "is-placing" : ""}`}
        onPointerDown={(event) => {
          if (event.button === 1) {
            startPan(event);
            return;
          }
          if (placing && event.button === 0) {
            addNoteAt(event.clientX, event.clientY);
            return;
          }
          if (event.target === event.currentTarget) {
            setSelectedId(null);
            setPlacing(false);
          }
        }}
        onWheel={(event) => {
          event.preventDefault();
          const rect = viewportRef.current?.getBoundingClientRect();
          if (!rect) return;

          const current = cameraRef.current;
          const pointerX = event.clientX - rect.left;
          const pointerY = event.clientY - rect.top;
          const worldX = (pointerX - current.x) / current.zoom;
          const worldY = (pointerY - current.y) / current.zoom;
          const zoom = Math.min(
            2,
            Math.max(0.35, current.zoom * Math.exp(-event.deltaY * 0.008)),
          );

          setCamera({
            zoom,
            x: pointerX - worldX * zoom,
            y: pointerY - worldY * zoom,
          });
        }}
        style={{
          backgroundPosition: `${camera.x}px ${camera.y}px`,
          backgroundSize: `${24 * camera.zoom}px ${24 * camera.zoom}px`,
        }}
      >
        <div
          className="board-world"
          style={{
            transform: `translate3d(${camera.x}px, ${camera.y}px, 0) scale(${camera.zoom})`,
          }}
        >
          {notes.map((note) => (
            <NoteCard
              key={note.id}
              note={note}
              zoom={camera.zoom}
              selected={selectedId === note.id}
              onSelect={() => setSelectedId(note.id)}
              onMove={(x, y) =>
                setNotes((current) =>
                  current.map((entry) =>
                    entry.id === note.id ? { ...entry, x, y } : entry,
                  ),
                )
              }
              onUpdate={(content) =>
                setNotes((current) =>
                  current.map((entry) =>
                    entry.id === note.id ? { ...entry, content } : entry,
                  ),
                )
              }
              onDelete={() => {
                setNotes((current) =>
                  current.filter((entry) => entry.id !== note.id),
                );
                setSelectedId(null);
              }}
            />
          ))}
        </div>

        <div className="board-hint">
          Clic en Nota → clic en el tablero · Arrastra la cabecera para mover ·
          Rueda para zoom · Botón central para pan
        </div>
      </div>
    </div>
  );
}

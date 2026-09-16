"use client";

import { Layout } from "lucide-react";
import { useEffect, useRef, useState, useTransition } from "react";
import {
  createBoardAction,
  listBoardsAction,
  updateBoardNameAction,
} from "@/app/actions/boards";
import { PanelCloseIcon } from "@/components/icons/panel-close-icon";
import { PanelOpenIcon } from "@/components/icons/panel-open-icon";
import type { BoardRecord } from "@/lib/boards";

const ICON_BUTTON_CLASS =
  "flex h-12 w-12 cursor-pointer items-center justify-center rounded-md text-[#525252] transition-colors hover:bg-[#f5f5f5]";

function BoardName({
  value,
  onSave,
}: {
  value: string;
  onSave: (name: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  const startEditing = () => {
    setDraft(value);
    setEditing(true);
    requestAnimationFrame(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    });
  };

  const save = () => {
    const trimmed = draft.trim();

    if (!trimmed || trimmed === value) {
      setDraft(value);
      setEditing(false);
      return;
    }

    onSave(trimmed);
    setEditing(false);
  };

  if (editing) {
    return (
      <input
        ref={inputRef}
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={save}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            save();
          }

          if (event.key === "Escape") {
            setDraft(value);
            setEditing(false);
          }
        }}
        className="w-full rounded border border-[#d4d4d4] bg-white px-1.5 py-0.5 text-[11px] text-[#404040] outline-none focus:border-[#a3a3a3]"
      />
    );
  }

  return (
    <button
      type="button"
      onClick={startEditing}
      className="min-w-0 flex-1 truncate text-left text-[11px] text-[#404040] hover:text-[#171717]"
    >
      {value}
    </button>
  );
}

export default function Home() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [boards, setBoards] = useState<BoardRecord[]>([]);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    void listBoardsAction().then(setBoards);
  }, []);

  const handleCreateBoard = () => {
    startTransition(async () => {
      const board = await createBoardAction();
      setBoards((current) => [...current, board]);
    });
  };

  const handleRenameBoard = (id: string, name: string) => {
    const previousBoards = boards;

    setBoards((current) =>
      current.map((board) => (board.id === id ? { ...board, name } : board)),
    );

    startTransition(async () => {
      try {
        await updateBoardNameAction(id, name);
      } catch {
        setBoards(previousBoards);
      }
    });
  };

  return (
    <main className="flex h-dvh w-full overflow-hidden bg-[#e8e8e8]">
      {sidebarOpen ? (
        <aside className="relative flex w-52 shrink-0 flex-col border-r border-[#d4d4d4] bg-white">
          <button
            type="button"
            aria-label="Cerrar panel"
            onClick={() => setSidebarOpen(false)}
            className={`${ICON_BUTTON_CLASS} absolute top-0 right-0`}
          >
            <PanelCloseIcon />
          </button>

          <div className="flex flex-col gap-4 px-2 pb-3 pt-14">
            <section>
              <h2 className="mb-2 px-1 text-[10px] font-medium uppercase tracking-wide text-[#a3a3a3]">
                Opciones
              </h2>
              <button
                type="button"
                aria-label="Crear pizarra"
                disabled={isPending}
                onClick={handleCreateBoard}
                className="flex w-full cursor-pointer flex-col items-center gap-1.5 rounded-lg py-2 text-[#525252] transition-colors hover:bg-[#f5f5f5] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Layout className="size-5" strokeWidth={1.5} />
                <span className="text-[11px] leading-none">Pizarra</span>
              </button>
            </section>

            <section className="border-t border-[#ececec] pt-4">
              <h2 className="mb-2 px-1 text-[10px] font-medium uppercase tracking-wide text-[#a3a3a3]">
                Elementos
              </h2>
              <div className="flex flex-col gap-0.5">
                {boards.map((board) => (
                  <div
                    key={board.id}
                    className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-[#f5f5f5]"
                  >
                    <Layout
                      className="size-3.5 shrink-0 text-[#737373]"
                      strokeWidth={1.5}
                    />
                    <BoardName
                      value={board.name}
                      onSave={(name) => handleRenameBoard(board.id, name)}
                    />
                  </div>
                ))}
              </div>
            </section>
          </div>
        </aside>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-12 shrink-0 items-center border-b border-[#d4d4d4] bg-white shadow-sm">
          {!sidebarOpen ? (
            <button
              type="button"
              aria-label="Abrir panel"
              onClick={() => setSidebarOpen(true)}
              className={`${ICON_BUTTON_CLASS} ml-1`}
            >
              <PanelOpenIcon />
            </button>
          ) : null}
        </header>
      </div>
    </main>
  );
}

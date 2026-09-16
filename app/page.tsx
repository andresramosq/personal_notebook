"use client";

import { Layout } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  createBoardAction,
  listBoardsAction,
  updateBoardNameAction,
} from "@/app/actions/boards";
import { PanelCloseIcon } from "@/components/icons/panel-close-icon";
import { PanelOpenIcon } from "@/components/icons/panel-open-icon";
import { BoardCanvas } from "@/components/board-canvas";
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

  const startEditing = (event: React.MouseEvent) => {
    event.stopPropagation();
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
        onClick={(event) => event.stopPropagation()}
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
        className="min-w-0 flex-1 rounded border border-[#d4d4d4] bg-white px-1 py-0.5 text-[11px] text-[#404040] outline-none focus:border-[#a3a3a3]"
      />
    );
  }

  return (
    <span
      title={value}
      onDoubleClick={startEditing}
      className="min-w-0 flex-1 truncate text-left text-[11px] text-[#404040]"
    >
      {value}
    </span>
  );
}

type BoardListItem = BoardRecord & {
  pending?: boolean;
};

export default function Home() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [boards, setBoards] = useState<BoardListItem[]>([]);
  const [activeBoardId, setActiveBoardId] = useState<string | null>(null);

  useEffect(() => {
    void listBoardsAction().then(setBoards);
  }, []);

  const handleCreateBoard = () => {
    const tempId = crypto.randomUUID();
    const tempBoard: BoardListItem = {
      id: tempId,
      name: `Pizarra ${boards.length + 1}`,
      createdAt: new Date(),
      pending: true,
    };

    setBoards((current) => [...current, tempBoard]);
    setActiveBoardId(tempId);

    void createBoardAction()
      .then((board) => {
        setBoards((current) =>
          current.map((item) => (item.id === tempId ? board : item)),
        );
        setActiveBoardId((current) => (current === tempId ? board.id : current));
      })
      .catch(() => {
        setBoards((current) => current.filter((item) => item.id !== tempId));
        setActiveBoardId((current) => (current === tempId ? null : current));
      });
  };

  const handleRenameBoard = (id: string, name: string) => {
    const previousBoards = boards;
    const board = boards.find((item) => item.id === id);

    if (board?.pending) {
      return;
    }

    setBoards((current) =>
      current.map((item) => (item.id === id ? { ...item, name } : item)),
    );

    void updateBoardNameAction(id, name).catch(() => {
      setBoards(previousBoards);
    });
  };

  return (
    <main className="flex h-dvh w-full overflow-hidden bg-[#e8e8e8]">
      {sidebarOpen ? (
        <aside className="relative flex w-[4.75rem] shrink-0 flex-col border-r border-[#d4d4d4] bg-white">
          <button
            type="button"
            aria-label="Cerrar panel"
            onClick={() => setSidebarOpen(false)}
            className={`${ICON_BUTTON_CLASS} absolute top-0 right-0`}
          >
            <PanelCloseIcon />
          </button>

          <div className="flex flex-col gap-3 px-1 pb-3 pt-14">
            <section>
              <h2 className="mb-1.5 truncate text-center text-[9px] font-medium uppercase tracking-wide text-[#a3a3a3]">
                Opciones
              </h2>
              <button
                type="button"
                aria-label="Crear pizarra"
                onClick={handleCreateBoard}
                className="flex w-full cursor-pointer flex-col items-center gap-1.5 rounded-lg py-2 text-[#525252] transition-colors hover:bg-[#f5f5f5]"
              >
                <Layout className="size-5" strokeWidth={1.5} />
                <span className="text-[11px] leading-none">Pizarra</span>
              </button>
            </section>

            <section className="border-t border-[#ececec] pt-3">
              <h2 className="mb-1.5 truncate text-center text-[9px] font-medium uppercase tracking-wide text-[#a3a3a3]">
                Elementos
              </h2>
              <div className="flex flex-col gap-0.5">
                {boards.map((board) => (
                  <button
                    key={board.id}
                    type="button"
                    onClick={() => setActiveBoardId(board.id)}
                    className={`flex min-w-0 cursor-pointer items-center gap-1 rounded-md px-1 py-1.5 text-left hover:bg-[#f5f5f5] ${
                      activeBoardId === board.id ? "bg-[#f5f5f5]" : ""
                    }`}
                  >
                    <Layout
                      className="size-3.5 shrink-0 text-[#737373]"
                      strokeWidth={1.5}
                    />
                    <BoardName
                      value={board.name}
                      onSave={(name) => handleRenameBoard(board.id, name)}
                    />
                  </button>
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

        {activeBoardId ? (
          <div className="min-h-0 flex-1">
            <BoardCanvas />
          </div>
        ) : null}
      </div>
    </main>
  );
}

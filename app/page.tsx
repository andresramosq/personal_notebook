"use client";

import { Layout } from "lucide-react";
import { useEffect, useState } from "react";
import {
  createBoardAction,
  deleteBoardAction,
  listBoardsAction,
  updateBoardNameAction,
} from "@/app/actions/boards";
import { PanelCloseIcon } from "@/components/icons/panel-close-icon";
import { PanelOpenIcon } from "@/components/icons/panel-open-icon";
import { BoardCanvas } from "@/components/board-canvas";
import type { BoardRecord } from "@/lib/boards";

const ICON_BUTTON_CLASS =
  "flex h-12 w-12 cursor-pointer items-center justify-center rounded-md text-[#525252] transition-colors hover:bg-[#f5f5f5]";

const CONTEXT_MENU_ITEM_CLASS =
  "block w-full cursor-pointer px-3 py-1.5 text-left text-[13px] text-[#404040] hover:bg-[#f5f5f5]";

function BoardName({
  value,
  onSave,
  isEditing,
  onRequestEdit,
  onFinishEditing,
}: {
  value: string;
  onSave: (name: string) => void;
  isEditing: boolean;
  onRequestEdit: () => void;
  onFinishEditing: () => void;
}) {
  if (isEditing) {
    return (
      <input
        autoFocus
        defaultValue={value}
        onClick={(event) => event.stopPropagation()}
        onBlur={(event) => {
          const trimmed = event.target.value.trim();

          if (trimmed && trimmed !== value) {
            onSave(trimmed);
          }

          onFinishEditing();
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            event.currentTarget.blur();
          }

          if (event.key === "Escape") {
            onFinishEditing();
          }
        }}
        className="min-w-0 flex-1 rounded border border-[#d4d4d4] bg-white px-1 py-0.5 text-[11px] text-[#404040] outline-none focus:border-[#a3a3a3]"
      />
    );
  }

  return (
    <span
      title={value}
      onDoubleClick={(event) => {
        event.stopPropagation();
        onRequestEdit();
      }}
      className="min-w-0 flex-1 truncate text-left text-[11px] text-[#404040]"
    >
      {value}
    </span>
  );
}

type BoardListItem = BoardRecord & {
  pending?: boolean;
};

type ContextMenuState = {
  x: number;
  y: number;
  boardId: string;
};

export default function Home() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [boards, setBoards] = useState<BoardListItem[]>([]);
  const [activeBoardId, setActiveBoardId] = useState<string | null>(null);
  const [editingBoardId, setEditingBoardId] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);

  useEffect(() => {
    void listBoardsAction().then(setBoards);
  }, []);

  useEffect(() => {
    if (!contextMenu) {
      return;
    }

    const closeMenu = () => setContextMenu(null);

    window.addEventListener("click", closeMenu);
    window.addEventListener("contextmenu", closeMenu);

    return () => {
      window.removeEventListener("click", closeMenu);
      window.removeEventListener("contextmenu", closeMenu);
    };
  }, [contextMenu]);

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

  const handleDeleteBoard = (id: string) => {
    const board = boards.find((item) => item.id === id);

    if (!board || board.pending) {
      return;
    }

    const confirmed = window.confirm(`¿Eliminar "${board.name}"?`);

    if (!confirmed) {
      return;
    }

    const previousBoards = boards;
    const previousActiveBoardId = activeBoardId;

    setBoards((current) => current.filter((item) => item.id !== id));

    if (activeBoardId === id) {
      setActiveBoardId(null);
    }

    if (editingBoardId === id) {
      setEditingBoardId(null);
    }

    void deleteBoardAction(id).catch(() => {
      setBoards(previousBoards);
      setActiveBoardId(previousActiveBoardId);
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
                    onContextMenu={(event) => {
                      if (board.pending) {
                        return;
                      }

                      event.preventDefault();
                      event.stopPropagation();
                      setContextMenu({
                        x: event.clientX,
                        y: event.clientY,
                        boardId: board.id,
                      });
                    }}
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
                      isEditing={editingBoardId === board.id}
                      onRequestEdit={() => setEditingBoardId(board.id)}
                      onFinishEditing={() => setEditingBoardId(null)}
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

      {contextMenu ? (
        <div
          className="fixed z-50 min-w-[10rem] overflow-hidden rounded-md border border-[#d4d4d4] bg-white py-1 shadow-lg"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onClick={(event) => event.stopPropagation()}
        >
          <button
            type="button"
            className={CONTEXT_MENU_ITEM_CLASS}
            onClick={() => {
              setEditingBoardId(contextMenu.boardId);
              setContextMenu(null);
            }}
          >
            Editar nombre
          </button>
          <button
            type="button"
            className={`${CONTEXT_MENU_ITEM_CLASS} text-[#dc2626] hover:bg-[#fef2f2]`}
            onClick={() => {
              handleDeleteBoard(contextMenu.boardId);
              setContextMenu(null);
            }}
          >
            Eliminar
          </button>
        </div>
      ) : null}
    </main>
  );
}

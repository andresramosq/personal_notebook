"use client";

import { Layout } from "lucide-react";
import { useEffect, useState } from "react";
import {
  createBoardAction,
  deleteBoardAction,
  listBoardsAction,
  listChildBoardsAction,
  updateBoardNameAction,
} from "@/app/actions/boards";
import { BoardCanvasCard } from "@/components/board/board-canvas-card";
import { BoardContextMenu } from "@/components/board/board-context-menu";
import { BoardSidebarItem } from "@/components/board/board-sidebar-item";
import { PanelCloseIcon } from "@/components/icons/panel-close-icon";
import { PanelOpenIcon } from "@/components/icons/panel-open-icon";
import { BoardCanvas } from "@/components/board-canvas";
import type { BoardRecord } from "@/lib/boards";

const ICON_BUTTON_CLASS =
  "flex h-12 w-12 cursor-pointer items-center justify-center rounded-md text-[#525252] transition-colors hover:bg-[#f5f5f5]";

type BoardListItem = BoardRecord & {
  pending?: boolean;
};

type ContextMenuState = {
  x: number;
  y: number;
  boardId: string;
};

function openContextMenu(
  event: React.MouseEvent,
  boardId: string,
  pending?: boolean,
) {
  if (pending) {
    return;
  }

  event.preventDefault();
  event.stopPropagation();

  return {
    x: event.clientX,
    y: event.clientY,
    boardId,
  };
}

export default function Home() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [boards, setBoards] = useState<BoardListItem[]>([]);
  const [childBoards, setChildBoards] = useState<BoardListItem[]>([]);
  const [activeBoardId, setActiveBoardId] = useState<string | null>(null);
  const [editingBoardId, setEditingBoardId] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);

  useEffect(() => {
    void listBoardsAction().then((items) => {
      setBoards(items.filter((board) => board.parentId === null));
    });
  }, []);

  useEffect(() => {
    if (!activeBoardId) {
      return;
    }

    void listChildBoardsAction(activeBoardId).then(setChildBoards);
  }, [activeBoardId]);

  const openBoard = (boardId: string) => {
    setChildBoards([]);
    setActiveBoardId(boardId);
  };

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
    if (activeBoardId) {
      const tempId = crypto.randomUUID();
      const tempBoard: BoardListItem = {
        id: tempId,
        name: `Pizarra ${childBoards.length + 1}`,
        parentId: activeBoardId,
        x: 120 + childBoards.length * 40,
        y: 120 + childBoards.length * 40,
        createdAt: new Date(),
        pending: true,
      };

      setChildBoards((current) => [...current, tempBoard]);

      void createBoardAction(activeBoardId)
        .then((board) => {
          setChildBoards((current) =>
            current.map((item) => (item.id === tempId ? board : item)),
          );
        })
        .catch(() => {
          setChildBoards((current) =>
            current.filter((item) => item.id !== tempId),
          );
        });

      return;
    }

    const tempId = crypto.randomUUID();
    const tempBoard: BoardListItem = {
      id: tempId,
      name: `Pizarra ${boards.length + 1}`,
      parentId: null,
      x: 120,
      y: 120,
      createdAt: new Date(),
      pending: true,
    };

    setBoards((current) => [...current, tempBoard]);
    openBoard(tempId);

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
    const board =
      boards.find((item) => item.id === id) ??
      childBoards.find((item) => item.id === id);

    if (board?.pending) {
      return;
    }

    const previousBoards = boards;
    const previousChildBoards = childBoards;

    setBoards((current) =>
      current.map((item) => (item.id === id ? { ...item, name } : item)),
    );
    setChildBoards((current) =>
      current.map((item) => (item.id === id ? { ...item, name } : item)),
    );

    void updateBoardNameAction(id, name).catch(() => {
      setBoards(previousBoards);
      setChildBoards(previousChildBoards);
    });
  };

  const handleDeleteBoard = (id: string) => {
    const board =
      boards.find((item) => item.id === id) ??
      childBoards.find((item) => item.id === id);

    if (!board || board.pending) {
      return;
    }

    const confirmed = window.confirm(`¿Eliminar "${board.name}"?`);

    if (!confirmed) {
      return;
    }

    const previousBoards = boards;
    const previousChildBoards = childBoards;
    const previousActiveBoardId = activeBoardId;

    setBoards((current) => current.filter((item) => item.id !== id));
    setChildBoards((current) => current.filter((item) => item.id !== id));

    if (activeBoardId === id) {
      setActiveBoardId(board.parentId);
    }

    if (editingBoardId === id) {
      setEditingBoardId(null);
    }

    void deleteBoardAction(id).catch(() => {
      setBoards(previousBoards);
      setChildBoards(previousChildBoards);
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
                  <BoardSidebarItem
                    key={board.id}
                    name={board.name}
                    isActive={activeBoardId === board.id}
                    isEditing={editingBoardId === board.id}
                    onOpen={() => openBoard(board.id)}
                    onContextMenu={(event) => {
                      const menu = openContextMenu(
                        event,
                        board.id,
                        board.pending,
                      );

                      if (menu) {
                        setContextMenu(menu);
                      }
                    }}
                    onRequestEdit={() => setEditingBoardId(board.id)}
                    onFinishEditing={() => setEditingBoardId(null)}
                    onSave={(name) => handleRenameBoard(board.id, name)}
                  />
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
            <BoardCanvas>
              {childBoards.map((board) => (
                <BoardCanvasCard
                  key={board.id}
                  name={board.name}
                  x={board.x}
                  y={board.y}
                  isEditing={editingBoardId === board.id}
                  onOpen={() => openBoard(board.id)}
                  onContextMenu={(event) => {
                    const menu = openContextMenu(
                      event,
                      board.id,
                      board.pending,
                    );

                    if (menu) {
                      setContextMenu(menu);
                    }
                  }}
                  onRequestEdit={() => setEditingBoardId(board.id)}
                  onFinishEditing={() => setEditingBoardId(null)}
                  onSave={(name) => handleRenameBoard(board.id, name)}
                />
              ))}
            </BoardCanvas>
          </div>
        ) : null}
      </div>

      {contextMenu ? (
        <BoardContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onEdit={() => {
            setEditingBoardId(contextMenu.boardId);
            setContextMenu(null);
          }}
          onDelete={() => {
            handleDeleteBoard(contextMenu.boardId);
            setContextMenu(null);
          }}
        />
      ) : null}
    </main>
  );
}

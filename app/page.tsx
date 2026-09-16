"use client";

import { useEffect, useRef, useState } from "react";
import {
  createBoardAction,
  createRootBoardAction,
  deleteBoardAction,
  listBoardsAction,
  listChildBoardsAction,
  updateBoardNameAction,
  updateBoardPositionAction,
} from "@/app/actions/boards";
import {
  BOARD_CARD_HEIGHT,
  BOARD_CARD_WIDTH,
  BoardCanvasCard,
} from "@/components/board/board-canvas-card";
import { BoardContextMenu } from "@/components/board/board-context-menu";
import { BoardPaletteButton } from "@/components/board/board-palette-button";
import { BoardSidebarItem } from "@/components/board/board-sidebar-item";
import { PanelCloseIcon } from "@/components/icons/panel-close-icon";
import { PanelOpenIcon } from "@/components/icons/panel-open-icon";
import {
  BoardCanvas,
  type BoardCanvasHandle,
} from "@/components/board-canvas";
import type { BoardRecord } from "@/lib/boards";

const ICON_BUTTON_CLASS =
  "flex h-12 w-12 cursor-pointer items-center justify-center rounded-md text-[#525252] transition-colors hover:bg-[#f5f5f5]";

const PLACEMENT_MOVE_THRESHOLD = 6;

type BoardListItem = BoardRecord & {
  pending?: boolean;
};

type ContextMenuState = {
  x: number;
  y: number;
  boardId: string;
};

type PlacementPreview = {
  x: number;
  y: number;
  name: string;
};

function previewAt(clientX: number, clientY: number, canvas: BoardCanvasHandle) {
  const { x, y } = canvas.screenToWorld(clientX, clientY);

  return {
    x: x - BOARD_CARD_WIDTH / 2,
    y: y - BOARD_CARD_HEIGHT / 2,
  };
}

export default function Home() {
  const canvasRef = useRef<BoardCanvasHandle>(null);
  const suppressCreateClickRef = useRef(false);
  const childBoardsCacheRef = useRef(new Map<string, BoardListItem[]>());
  const activeBoardIdRef = useRef<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [boards, setBoards] = useState<BoardListItem[]>([]);
  const [childBoards, setChildBoards] = useState<BoardListItem[]>([]);
  const [activeBoardId, setActiveBoardId] = useState<string | null>(null);
  const [editingBoardId, setEditingBoardId] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [placementPreview, setPlacementPreview] =
    useState<PlacementPreview | null>(null);

  useEffect(() => {
    activeBoardIdRef.current = activeBoardId;
  }, [activeBoardId]);

  useEffect(() => {
    void listBoardsAction().then(setBoards);
  }, []);

  const cacheChildBoards = (parentId: string, items: BoardListItem[]) => {
    childBoardsCacheRef.current.set(parentId, items);
  };

  const setActiveChildBoards = (
    parentId: string | null,
    updater: (current: BoardListItem[]) => BoardListItem[],
  ) => {
    setChildBoards((current) => {
      const next = updater(current);

      if (parentId) {
        cacheChildBoards(parentId, next);
      }

      return next;
    });
  };

  const prefetchChildBoards = (parentId: string) => {
    if (childBoardsCacheRef.current.has(parentId)) {
      return;
    }

    void listChildBoardsAction(parentId).then((items) => {
      cacheChildBoards(parentId, items);

      if (activeBoardIdRef.current === parentId) {
        setChildBoards(items);
      }
    });
  };

  useEffect(() => {
    if (!activeBoardId) {
      setChildBoards([]);
      return;
    }

    const rootBoard = boards.find((board) => board.id === activeBoardId);

    if (rootBoard?.pending) {
      setChildBoards([]);
      return;
    }

    const cached = childBoardsCacheRef.current.get(activeBoardId);

    if (cached) {
      setChildBoards(cached);
    }

    void listChildBoardsAction(activeBoardId).then((items) => {
      if (activeBoardIdRef.current !== activeBoardId) {
        return;
      }

      cacheChildBoards(activeBoardId, items);
      setChildBoards(items);
    });
  }, [activeBoardId, boards]);

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

  const openBoard = (boardId: string) => {
    const cached = childBoardsCacheRef.current.get(boardId);
    setChildBoards(cached ?? []);
    setActiveBoardId(boardId);
  };

  const openContextMenu = (
    event: React.MouseEvent,
    boardId: string,
    pending?: boolean,
  ) => {
    if (pending) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    setContextMenu({
      x: event.clientX,
      y: event.clientY,
      boardId,
    });
  };

  const handleCreateRootBoard = () => {
    if (suppressCreateClickRef.current) {
      suppressCreateClickRef.current = false;
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
    setActiveBoardId(tempId);

    void createRootBoardAction()
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

  const handleCreateChildBoard = (x: number, y: number) => {
    if (!activeBoardId) {
      return;
    }

    const nextName = `Pizarra ${childBoards.length + 1}`;
    const tempId = crypto.randomUUID();
    const tempBoard: BoardListItem = {
      id: tempId,
      name: nextName,
      parentId: activeBoardId,
      x,
      y,
      createdAt: new Date(),
      pending: true,
    };

    setActiveChildBoards(activeBoardId, (current) => [...current, tempBoard]);

    void createBoardAction({ parentId: activeBoardId, x, y })
      .then((board) => {
        setActiveChildBoards(activeBoardId, (current) =>
          current.map((item) => (item.id === tempId ? board : item)),
        );
      })
      .catch(() => {
        setActiveChildBoards(activeBoardId, (current) =>
          current.filter((item) => item.id !== tempId),
        );
      });
  };

  const handleStartPlacement = (
    event: React.PointerEvent<HTMLButtonElement>,
  ) => {
    if (!activeBoardId) {
      return;
    }

    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    const startX = event.clientX;
    const startY = event.clientY;
    let moved = false;
    const previewName = `Pizarra ${childBoards.length + 1}`;

    const updatePreview = (clientX: number, clientY: number) => {
      const position = previewAt(clientX, clientY, canvas);

      setPlacementPreview({
        ...position,
        name: previewName,
      });
    };

    const handleMove = (moveEvent: PointerEvent) => {
      if (
        !moved &&
        (Math.abs(moveEvent.clientX - startX) > PLACEMENT_MOVE_THRESHOLD ||
          Math.abs(moveEvent.clientY - startY) > PLACEMENT_MOVE_THRESHOLD)
      ) {
        moved = true;
      }

      if (!moved) {
        return;
      }

      updatePreview(moveEvent.clientX, moveEvent.clientY);
    };

    const finish = (upEvent: PointerEvent) => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", finish);
      window.removeEventListener("pointercancel", finish);
      setPlacementPreview(null);

      if (
        !moved ||
        !canvas.isOverCanvas(upEvent.clientX, upEvent.clientY)
      ) {
        return;
      }

      const position = previewAt(upEvent.clientX, upEvent.clientY, canvas);
      suppressCreateClickRef.current = true;
      handleCreateChildBoard(position.x, position.y);
    };

    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", finish);
    window.addEventListener("pointercancel", finish);
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
    setChildBoards((current) => {
      const next = current.map((item) =>
        item.id === id ? { ...item, name } : item,
      );

      if (activeBoardIdRef.current) {
        cacheChildBoards(activeBoardIdRef.current, next);
      }

      return next;
    });

    void updateBoardNameAction(id, name).catch(() => {
      setBoards(previousBoards);
      setChildBoards(previousChildBoards);
    });
  };

  const handleMoveBoard = (id: string, x: number, y: number) => {
    const board = childBoards.find((item) => item.id === id);

    if (!board || board.pending) {
      return;
    }

    const previousChildBoards = childBoards;

    setActiveChildBoards(activeBoardId, (current) =>
      current.map((item) => (item.id === id ? { ...item, x, y } : item)),
    );

    void updateBoardPositionAction(id, x, y).catch(() => {
      setActiveChildBoards(activeBoardId, () => previousChildBoards);
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
    setActiveChildBoards(activeBoardId, (current) =>
      current.filter((item) => item.id !== id),
    );

    if (board.parentId) {
      childBoardsCacheRef.current.delete(board.parentId);
    }
    childBoardsCacheRef.current.delete(id);

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
              <BoardPaletteButton
                onCreate={handleCreateRootBoard}
                onStartPlacement={
                  activeBoardId ? handleStartPlacement : undefined
                }
              />
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
                    onPrefetch={() => {
                      if (!board.pending) {
                        prefetchChildBoards(board.id);
                      }
                    }}
                    onContextMenu={(event) =>
                      openContextMenu(event, board.id, board.pending)
                    }
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

        <div className="min-h-0 flex-1">
          <BoardCanvas ref={canvasRef} placementPreview={placementPreview}>
            {activeBoardId
              ? childBoards.map((board) => (
                  <BoardCanvasCard
                    key={board.id}
                    name={board.name}
                    x={board.x}
                    y={board.y}
                    isEditing={editingBoardId === board.id}
                    onOpen={() => openBoard(board.id)}
                    onMove={(x, y) => handleMoveBoard(board.id, x, y)}
                    onContextMenu={(event) =>
                      openContextMenu(event, board.id, board.pending)
                    }
                    onRequestEdit={() => setEditingBoardId(board.id)}
                    onFinishEditing={() => setEditingBoardId(null)}
                    onSave={(name) => handleRenameBoard(board.id, name)}
                  />
                ))
              : null}
          </BoardCanvas>
        </div>
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

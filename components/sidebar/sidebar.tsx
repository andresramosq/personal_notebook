"use client";

import { useState, useTransition } from "react";
import {
  createBoardAction,
  updateBoardNameAction,
} from "@/app/actions/boards";
import { BoardIcon } from "@/components/icons/board-icon";
import { PanelCloseIcon } from "@/components/icons/panel-close-icon";
import { EditableName } from "@/components/ui/editable-name";
import type { BoardRecord } from "@/lib/boards";

const ICON_BUTTON_CLASS =
  "flex h-12 w-12 cursor-pointer items-center justify-center rounded-md text-[#525252] transition-colors hover:bg-[#f5f5f5]";

type SidebarProps = {
  initialBoards: BoardRecord[];
  onClose: () => void;
};

export function Sidebar({ initialBoards, onClose }: SidebarProps) {
  const [boards, setBoards] = useState(initialBoards);
  const [isPending, startTransition] = useTransition();

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
    <aside className="relative flex w-60 shrink-0 flex-col border-r border-[#d4d4d4] bg-white">
      <button
        type="button"
        aria-label="Cerrar panel"
        onClick={onClose}
        className={`${ICON_BUTTON_CLASS} absolute top-0 right-0`}
      >
        <PanelCloseIcon />
      </button>

      <div className="flex flex-col gap-1 px-2 pb-3 pt-14">
        <button
          type="button"
          aria-label="Crear pizarra"
          disabled={isPending}
          onClick={handleCreateBoard}
          className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-[#525252] transition-colors hover:bg-[#f5f5f5] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <BoardIcon />
          <span className="text-[13px]">Nueva pizarra</span>
        </button>

        <div className="mt-2 flex flex-col gap-0.5">
          {boards.map((board) => (
            <div
              key={board.id}
              className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-[#f5f5f5]"
            >
              <BoardIcon className="size-4 shrink-0 text-[#737373]" />
              <EditableName
                value={board.name}
                onSave={(name) => handleRenameBoard(board.id, name)}
              />
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}

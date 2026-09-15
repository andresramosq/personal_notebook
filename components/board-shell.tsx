"use client";

import { useRef, useState } from "react";
import {
  createBoardLinkAction,
  updateBoardLinkPositionAction,
  updateBoardNameAction,
} from "@/app/actions/boards";
import { BoardLinkCard } from "@/components/board-link-card";
import { BoardSidebar, PIZARRA_DRAG_TYPE } from "@/components/board-sidebar";
import { EditableName } from "@/components/editable-name";

export type BoardLinkItem = {
  id: string;
  targetBoardId: string;
  name: string;
  x: number;
  y: number;
  pending?: boolean;
};

type BoardShellProps = {
  boardId: string;
  boardName: string;
  backHref: string | null;
  initialLinks: BoardLinkItem[];
};

export function BoardShell({
  boardId,
  boardName: initialBoardName,
  backHref,
  initialLinks,
}: BoardShellProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [boardName, setBoardName] = useState(initialBoardName);
  const [links, setLinks] = useState(initialLinks);

  const renameBoard = (targetBoardId: string, name: string) => {
    const previousBoardName = boardName;
    const previousLinks = links;

    if (targetBoardId === boardId) {
      setBoardName(name);
    }

    setLinks((current) =>
      current.map((link) =>
        link.targetBoardId === targetBoardId ? { ...link, name } : link,
      ),
    );

    void updateBoardNameAction(targetBoardId, name).catch(() => {
      setBoardName(previousBoardName);
      setLinks(previousLinks);
    });
  };

  const updateLinkPosition = (linkId: string, x: number, y: number) => {
    setLinks((current) =>
      current.map((link) =>
        link.id === linkId ? { ...link, x, y } : link,
      ),
    );

    void updateBoardLinkPositionAction(linkId, boardId, x, y);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();

    if (!event.dataTransfer.getData(PIZARRA_DRAG_TYPE) || !canvasRef.current) {
      return;
    }

    const rect = canvasRef.current.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const tempId = crypto.randomUUID();
    const tempLink: BoardLinkItem = {
      id: tempId,
      targetBoardId: tempId,
      name: "Pizarra…",
      x,
      y,
      pending: true,
    };

    setLinks((current) => [...current, tempLink]);

    void createBoardLinkAction(boardId, x, y)
      .then((link) => {
        setLinks((current) =>
          current.map((item) => (item.id === tempId ? link : item)),
        );
      })
      .catch(() => {
        setLinks((current) => current.filter((item) => item.id !== tempId));
      });
  };

  return (
    <div className="flex h-dvh w-full overflow-hidden bg-[#fafafa]">
      <BoardSidebar backHref={backHref} />

      <div className="relative min-w-0 flex-1">
        <div
          ref={canvasRef}
          className="board-canvas relative h-full w-full"
          onDragOver={(event) => {
            event.preventDefault();
            event.dataTransfer.dropEffect = "copy";
          }}
          onDrop={handleDrop}
        >
          <div className="absolute top-5 left-6 max-w-xs">
            <EditableName
              value={boardName}
              onSave={(name) => renameBoard(boardId, name)}
              className="text-[13px] text-[#737373] hover:text-[#404040]"
              inputClassName="rounded border border-[#d4d4d4] bg-white px-2 py-1 text-[13px] text-[#404040] outline-none focus:border-[#a3a3a3]"
            />
          </div>

          {links.map((link) => (
            <BoardLinkCard
              key={link.id}
              link={link}
              getCanvasRect={() =>
                canvasRef.current?.getBoundingClientRect() ?? null
              }
              onMove={updateLinkPosition}
              onRename={renameBoard}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

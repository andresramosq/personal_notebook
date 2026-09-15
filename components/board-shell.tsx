"use client";

import { useCallback, useRef, useState } from "react";
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

type PanState = {
  x: number;
  y: number;
};

const MIN_ZOOM = 0.25;
const MAX_ZOOM = 3;

export function BoardShell({
  boardId,
  boardName: initialBoardName,
  backHref,
  initialLinks,
}: BoardShellProps) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const [boardName, setBoardName] = useState(initialBoardName);
  const [links, setLinks] = useState(initialLinks);
  const [handToolActive, setHandToolActive] = useState(false);
  const [pan, setPan] = useState<PanState>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const panSession = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    panX: number;
    panY: number;
  } | null>(null);

  const screenToWorld = useCallback(
    (clientX: number, clientY: number) => {
      const rect = viewportRef.current?.getBoundingClientRect();

      if (!rect) {
        return { x: 0, y: 0 };
      }

      return {
        x: (clientX - rect.left - pan.x) / zoom,
        y: (clientY - rect.top - pan.y) / zoom,
      };
    },
    [pan.x, pan.y, zoom],
  );

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

    if (
      handToolActive ||
      !event.dataTransfer.getData(PIZARRA_DRAG_TYPE) ||
      !viewportRef.current
    ) {
      return;
    }

    const { x, y } = screenToWorld(event.clientX, event.clientY);
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

  const handleWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    if (!handToolActive || !viewportRef.current) {
      return;
    }

    event.preventDefault();

    const rect = viewportRef.current.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;
    const zoomFactor = event.deltaY > 0 ? 0.92 : 1.08;
    const nextZoom = Math.min(Math.max(zoom * zoomFactor, MIN_ZOOM), MAX_ZOOM);
    const worldX = (mouseX - pan.x) / zoom;
    const worldY = (mouseY - pan.y) / zoom;

    setZoom(nextZoom);
    setPan({
      x: mouseX - worldX * nextZoom,
      y: mouseY - worldY * nextZoom,
    });
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!handToolActive || event.button !== 0) {
      return;
    }

    panSession.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      panX: pan.x,
      panY: pan.y,
    };

    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const session = panSession.current;

    if (!session || session.pointerId !== event.pointerId) {
      return;
    }

    setPan({
      x: session.panX + (event.clientX - session.startX),
      y: session.panY + (event.clientY - session.startY),
    });
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    const session = panSession.current;

    if (!session || session.pointerId !== event.pointerId) {
      return;
    }

    panSession.current = null;
    event.currentTarget.releasePointerCapture(event.pointerId);
  };

  return (
    <div className="flex h-dvh w-full overflow-hidden bg-[#fafafa]">
      <BoardSidebar
        backHref={backHref}
        handToolActive={handToolActive}
        onToggleHandTool={() => setHandToolActive((active) => !active)}
      />

      <div className="relative min-w-0 flex-1">
        <div
          ref={viewportRef}
          className={`board-canvas relative h-full w-full overflow-hidden ${
            handToolActive ? "cursor-grab active:cursor-grabbing" : ""
          }`}
          onDragOver={(event) => {
            if (handToolActive) {
              return;
            }

            event.preventDefault();
            event.dataTransfer.dropEffect = "copy";
          }}
          onDrop={handleDrop}
          onWheel={handleWheel}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        >
          <div
            className="relative h-full w-full"
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: "0 0",
            }}
          >
            <div
              className={`absolute top-5 left-6 max-w-xs ${
                handToolActive ? "pointer-events-none" : ""
              }`}
            >
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
                interactionEnabled={!handToolActive}
                screenToWorld={screenToWorld}
                onMove={updateLinkPosition}
                onRename={renameBoard}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

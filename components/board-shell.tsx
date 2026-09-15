"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  createBoardLinkAction,
  updateBoardLinkPositionAction,
  updateBoardNameAction,
} from "@/app/actions/boards";
import { BoardLinkCard } from "@/components/board-link-card";
import { BoardSidebar, PIZARRA_DRAG_TYPE } from "@/components/board-sidebar";
import {
  canPlaceBoardCard,
  clampBoardPosition,
  type BoardSize,
} from "@/lib/board-config";

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
  isHome: boolean;
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
  isHome,
  backHref,
  initialLinks,
}: BoardShellProps) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const [boardName, setBoardName] = useState(initialBoardName);
  const [links, setLinks] = useState(initialLinks);
  const [boardSize, setBoardSize] = useState<BoardSize>({ width: 0, height: 0 });
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

  useEffect(() => {
    const viewport = viewportRef.current;

    if (!viewport) {
      return;
    }

    const updateSize = () => {
      setBoardSize({
        width: viewport.clientWidth,
        height: viewport.clientHeight,
      });
    };

    updateSize();

    const observer = new ResizeObserver(updateSize);
    observer.observe(viewport);

    return () => observer.disconnect();
  }, []);

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
    if (boardSize.width === 0 || boardSize.height === 0) {
      return;
    }

    const clamped = clampBoardPosition(x, y, boardSize);

    setLinks((current) =>
      current.map((link) =>
        link.id === linkId ? { ...link, ...clamped } : link,
      ),
    );

    void updateBoardLinkPositionAction(
      linkId,
      boardId,
      clamped.x,
      clamped.y,
    );
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();

    if (
      handToolActive ||
      !event.dataTransfer.getData(PIZARRA_DRAG_TYPE) ||
      !viewportRef.current ||
      boardSize.width === 0 ||
      boardSize.height === 0
    ) {
      return;
    }

    const { x, y } = screenToWorld(event.clientX, event.clientY);

    if (!canPlaceBoardCard(x, y, boardSize)) {
      return;
    }

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
    <div className="flex h-dvh w-full overflow-hidden bg-[#ebebeb]">
      <BoardSidebar
        backHref={backHref}
        handToolActive={handToolActive}
        onToggleHandTool={() => setHandToolActive((active) => !active)}
      />

      <div className="relative flex min-w-0 flex-1 flex-col">
        <header className="flex h-12 shrink-0 items-center border-b border-[#ececec] bg-white px-5">
          <h1 className="text-[13px] font-medium text-[#404040]">
            {isHome ? "Home" : boardName}
          </h1>
        </header>

        <div
          ref={viewportRef}
          className={`relative min-h-0 flex-1 overflow-hidden bg-[#ebebeb] ${
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
          {boardSize.width > 0 && boardSize.height > 0 ? (
            <div
              className="board-surface absolute top-0 left-0 border border-[#d4d4d4] bg-[#fafafa] shadow-sm"
              style={{
                width: boardSize.width,
                height: boardSize.height,
                transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                transformOrigin: "0 0",
              }}
            >
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
          ) : null}
        </div>
      </div>
    </div>
  );
}

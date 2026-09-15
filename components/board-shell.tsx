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
  DEFAULT_BOARD_SIZE,
  isPointInsideBoard,
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

const MIN_ZOOM = 0.5;
const MAX_ZOOM = 2;

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
  const [handToolActive, setHandToolActive] = useState(false);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const panSession = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    panX: number;
    panY: number;
  } | null>(null);
  const zoomRef = useRef(zoom);
  const panRef = useRef(pan);
  const handToolActiveRef = useRef(handToolActive);

  useEffect(() => {
    zoomRef.current = zoom;
  }, [zoom]);

  useEffect(() => {
    panRef.current = pan;
  }, [pan]);

  useEffect(() => {
    handToolActiveRef.current = handToolActive;
  }, [handToolActive]);

  useEffect(() => {
    const viewport = viewportRef.current;

    if (!viewport) {
      return;
    }

    const offsetX = (viewport.clientWidth - DEFAULT_BOARD_SIZE.width) / 2;
    const offsetY = (viewport.clientHeight - DEFAULT_BOARD_SIZE.height) / 2;

    setPan({
      x: Math.max(32, offsetX),
      y: Math.max(32, offsetY),
    });
  }, []);

  useEffect(() => {
    const viewport = viewportRef.current;

    if (!viewport) {
      return;
    }

    const handleWheel = (event: WheelEvent) => {
      if (!handToolActiveRef.current) {
        return;
      }

      event.preventDefault();

      const rect = viewport.getBoundingClientRect();
      const mouseX = event.clientX - rect.left;
      const mouseY = event.clientY - rect.top;
      const zoomFactor = event.deltaY > 0 ? 0.92 : 1.08;
      const currentZoom = zoomRef.current;
      const currentPan = panRef.current;
      const nextZoom = Math.min(
        Math.max(currentZoom * zoomFactor, MIN_ZOOM),
        MAX_ZOOM,
      );
      const worldX = (mouseX - currentPan.x) / currentZoom;
      const worldY = (mouseY - currentPan.y) / currentZoom;

      setZoom(nextZoom);
      setPan({
        x: mouseX - worldX * nextZoom,
        y: mouseY - worldY * nextZoom,
      });
    };

    viewport.addEventListener("wheel", handleWheel, { passive: false });

    return () => viewport.removeEventListener("wheel", handleWheel);
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

  const previewLinkPosition = (linkId: string, x: number, y: number) => {
    const clamped = clampBoardPosition(x, y);

    setLinks((current) =>
      current.map((link) =>
        link.id === linkId ? { ...link, ...clamped } : link,
      ),
    );
  };

  const commitLinkPosition = (linkId: string, x: number, y: number) => {
    const clamped = clampBoardPosition(x, y);

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

  const handleBoardDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();

    if (handToolActive || !event.dataTransfer.getData(PIZARRA_DRAG_TYPE)) {
      return;
    }

    const { x, y } = screenToWorld(event.clientX, event.clientY);

    if (!isPointInsideBoard(x, y) || !canPlaceBoardCard(x, y)) {
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

  const handleViewportPointerDown = (
    event: React.PointerEvent<HTMLDivElement>,
  ) => {
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

  const handleViewportPointerMove = (
    event: React.PointerEvent<HTMLDivElement>,
  ) => {
    const session = panSession.current;

    if (!session || session.pointerId !== event.pointerId) {
      return;
    }

    setPan({
      x: session.panX + (event.clientX - session.startX),
      y: session.panY + (event.clientY - session.startY),
    });
  };

  const handleViewportPointerUp = (
    event: React.PointerEvent<HTMLDivElement>,
  ) => {
    const session = panSession.current;

    if (!session || session.pointerId !== event.pointerId) {
      return;
    }

    panSession.current = null;
    event.currentTarget.releasePointerCapture(event.pointerId);
  };

  return (
    <div className="flex h-dvh w-full overflow-hidden bg-[#e8e8e8]">
      <BoardSidebar
        backHref={backHref}
        handToolActive={handToolActive}
        onToggleHandTool={() => setHandToolActive((active) => !active)}
      />

      <div className="relative flex min-w-0 flex-1 flex-col">
        <header className="relative z-20 flex h-12 shrink-0 items-center border-b border-[#ececec] bg-white px-5">
          <h1 className="text-[13px] font-medium text-[#404040]">
            {isHome ? "Home" : boardName}
          </h1>
        </header>

        <div
          ref={viewportRef}
          className={`relative z-0 min-h-0 flex-1 overflow-hidden bg-[#e8e8e8] ${
            handToolActive
              ? "cursor-grab touch-none active:cursor-grabbing"
              : ""
          }`}
          onPointerDown={handleViewportPointerDown}
          onPointerMove={handleViewportPointerMove}
          onPointerUp={handleViewportPointerUp}
          onPointerCancel={handleViewportPointerUp}
        >
          <div
            className="absolute top-0 left-0"
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: "0 0",
            }}
          >
            <div
              className="board-surface relative border border-[#d4d4d4] bg-[#fafafa] shadow-sm"
              style={{
                width: DEFAULT_BOARD_SIZE.width,
                height: DEFAULT_BOARD_SIZE.height,
              }}
              onDragOver={(event) => {
                if (handToolActive) {
                  return;
                }

                event.preventDefault();
                event.stopPropagation();
                event.dataTransfer.dropEffect = "copy";
              }}
              onDrop={handleBoardDrop}
            >
              {links.map((link) => (
                <BoardLinkCard
                  key={link.id}
                  link={link}
                  selectMode={!handToolActive}
                  screenToWorld={screenToWorld}
                  onMovePreview={previewLinkPosition}
                  onMoveCommit={commitLinkPosition}
                  onRename={renameBoard}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

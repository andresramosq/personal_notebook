"use client";

import { memo, useEffect, useRef } from "react";
import { BoardName } from "@/components/board/board-name";
import { useBoardCanvas } from "@/components/board/board-canvas-context";

export const BOARD_CARD_WIDTH = 160;
export const BOARD_CARD_HEIGHT = 112;

type BoardCanvasCardProps = {
  name: string;
  x: number;
  y: number;
  isEditing: boolean;
  onOpen: () => void;
  onMove: (x: number, y: number) => void;
  onContextMenu: (event: React.MouseEvent<HTMLDivElement>) => void;
  onRequestEdit: () => void;
  onFinishEditing: () => void;
  onSave: (name: string) => void;
};

type DragState = {
  pointerId: number;
  startX: number;
  startY: number;
  originX: number;
  originY: number;
  moved: boolean;
  openOnRelease: boolean;
};

export const BoardCanvasCard = memo(function BoardCanvasCard({
  name,
  x,
  y,
  isEditing,
  onOpen,
  onMove,
  onContextMenu,
  onRequestEdit,
  onFinishEditing,
  onSave,
}: BoardCanvasCardProps) {
  const { getZoom } = useBoardCanvas();
  const cardRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<DragState | null>(null);
  const positionRef = useRef({ x, y });

  useEffect(() => {
    positionRef.current = { x, y };

    const card = cardRef.current;

    if (!card || dragRef.current) {
      return;
    }

    card.style.left = `${x}px`;
    card.style.top = `${y}px`;
  }, [x, y]);

  const stopWindowDrag = (
    moveHandler: (event: PointerEvent) => void,
    upHandler: (event: PointerEvent) => void,
  ) => {
    window.removeEventListener("pointermove", moveHandler);
    window.removeEventListener("pointerup", upHandler);
    window.removeEventListener("pointercancel", upHandler);
  };

  const startDrag = (
    event: React.PointerEvent<HTMLDivElement>,
    openOnRelease: boolean,
  ) => {
    if (isEditing || event.button !== 0) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: positionRef.current.x,
      originY: positionRef.current.y,
      moved: false,
      openOnRelease,
    };

    const handleMove = (moveEvent: PointerEvent) => {
      const drag = dragRef.current;

      if (!drag || drag.pointerId !== moveEvent.pointerId) {
        return;
      }

      const zoom = getZoom();
      const deltaX = (moveEvent.clientX - drag.startX) / zoom;
      const deltaY = (moveEvent.clientY - drag.startY) / zoom;

      if (!drag.moved && (Math.abs(deltaX) > 3 || Math.abs(deltaY) > 3)) {
        drag.moved = true;
      }

      if (!drag.moved) {
        return;
      }

      moveEvent.preventDefault();

      const card = cardRef.current;

      if (!card) {
        return;
      }

      const nextX = drag.originX + deltaX;
      const nextY = drag.originY + deltaY;

      positionRef.current = { x: nextX, y: nextY };
      card.style.left = `${nextX}px`;
      card.style.top = `${nextY}px`;
    };

    const handleUp = (upEvent: PointerEvent) => {
      const drag = dragRef.current;

      if (!drag || drag.pointerId !== upEvent.pointerId) {
        return;
      }

      stopWindowDrag(handleMove, handleUp);

      const didMove = drag.moved;
      const shouldOpen = drag.openOnRelease;
      dragRef.current = null;

      const nextX = positionRef.current.x;
      const nextY = positionRef.current.y;

      if (didMove) {
        if (nextX !== x || nextY !== y) {
          onMove(nextX, nextY);
        }
        return;
      }

      if (shouldOpen) {
        onOpen();
      }
    };

    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
    window.addEventListener("pointercancel", handleUp);
  };

  return (
    <div
      ref={cardRef}
      className="absolute touch-none select-none overflow-hidden rounded-lg border border-[#d4d4d4] bg-white shadow-sm"
      style={{
        left: x,
        top: y,
        width: BOARD_CARD_WIDTH,
        height: BOARD_CARD_HEIGHT,
      }}
      onContextMenu={onContextMenu}
      onPointerDown={(event) => {
        const target = event.target as HTMLElement;

        if (target.closest("[data-board-name]")) {
          return;
        }

        startDrag(event, target.closest("[data-board-open]") !== null);
      }}
    >
      <div className="flex h-7 cursor-grab items-center border-b border-[#ececec] bg-[#fafafa] px-2 active:cursor-grabbing">
        <BoardName
          value={name}
          isEditing={isEditing}
          editOnClick
          onRequestEdit={onRequestEdit}
          onFinishEditing={onFinishEditing}
          onSave={onSave}
          className="min-w-0 flex-1 cursor-text truncate text-left text-[11px] font-medium text-[#525252]"
          inputClassName="w-full rounded border border-[#d4d4d4] bg-white px-1.5 py-0.5 text-[11px] text-[#404040] outline-none focus:border-[#a3a3a3]"
        />
      </div>
      <div
        data-board-open
        className="h-[calc(100%-1.75rem)] cursor-grab bg-white active:cursor-grabbing"
      />
    </div>
  );
});

export function BoardCanvasCardPreview({
  x,
  y,
  name = "Pizarra",
}: {
  x: number;
  y: number;
  name?: string;
}) {
  return (
    <div
      className="pointer-events-none absolute overflow-hidden rounded-lg border-2 border-dashed border-[#737373] bg-white/80 shadow-lg"
      style={{
        left: x,
        top: y,
        width: BOARD_CARD_WIDTH,
        height: BOARD_CARD_HEIGHT,
      }}
    >
      <div className="flex h-7 items-center border-b border-[#ececec] bg-[#fafafa] px-2">
        <span className="truncate text-[11px] font-medium text-[#525252]">
          {name}
        </span>
      </div>
      <div className="h-[calc(100%-1.75rem)] bg-white/70" />
    </div>
  );
}

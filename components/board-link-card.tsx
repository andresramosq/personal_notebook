"use client";

import { useRef } from "react";
import { useRouter } from "next/navigation";
import { EditableName } from "@/components/editable-name";
import type { BoardLinkItem } from "@/components/board-shell";

type BoardLinkCardProps = {
  link: BoardLinkItem;
  interactionEnabled: boolean;
  screenToWorld: (clientX: number, clientY: number) => { x: number; y: number };
  onMove: (linkId: string, x: number, y: number) => void;
  onRename: (targetBoardId: string, name: string) => void;
};

const DRAG_THRESHOLD = 5;

export function BoardLinkCard({
  link,
  interactionEnabled,
  screenToWorld,
  onMove,
  onRename,
}: BoardLinkCardProps) {
  const router = useRouter();
  const pointerSession = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    dragging: boolean;
  } | null>(null);

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!interactionEnabled || link.pending) {
      return;
    }

    pointerSession.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      dragging: false,
    };

    event.currentTarget.setPointerCapture(event.pointerId);
    event.stopPropagation();
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const session = pointerSession.current;

    if (
      !session ||
      session.pointerId !== event.pointerId ||
      !interactionEnabled
    ) {
      return;
    }

    const deltaX = event.clientX - session.startX;
    const deltaY = event.clientY - session.startY;

    if (
      !session.dragging &&
      Math.hypot(deltaX, deltaY) >= DRAG_THRESHOLD
    ) {
      session.dragging = true;
    }
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    const session = pointerSession.current;

    if (!session || session.pointerId !== event.pointerId) {
      return;
    }

    pointerSession.current = null;
    event.currentTarget.releasePointerCapture(event.pointerId);

    if (session.dragging) {
      if (event.clientX !== 0 || event.clientY !== 0) {
        const { x, y } = screenToWorld(event.clientX, event.clientY);
        onMove(link.id, x, y);
      }
      return;
    }

    router.push(`/pizarra/${link.targetBoardId}`);
  };

  return (
    <div
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onMouseEnter={() => {
        if (interactionEnabled && !link.pending) {
          router.prefetch(`/pizarra/${link.targetBoardId}`);
        }
      }}
      className={`board-card absolute h-[7.5rem] w-[11rem] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-lg touch-none ${
        interactionEnabled
          ? "cursor-pointer"
          : "pointer-events-none"
      }`}
      style={{ left: link.x, top: link.y }}
    >
      <div
        className="flex h-7 items-center border-b border-[#ececec] bg-[#fafafa] px-2"
        onPointerDown={(event) => event.stopPropagation()}
      >
        <EditableName
          value={link.name}
          onSave={(name) => onRename(link.targetBoardId, name)}
          className="w-full truncate text-left text-[11px] font-medium text-[#525252] hover:text-[#171717]"
          inputClassName="w-full rounded border border-[#d4d4d4] bg-white px-1.5 py-0.5 text-[11px] text-[#404040] outline-none focus:border-[#a3a3a3]"
        />
      </div>
      <div className="h-full bg-white" />
    </div>
  );
}

"use client";

import { useRef } from "react";
import { useRouter } from "next/navigation";
import type { BoardLinkItem } from "@/components/board-shell";

type BoardLinkCardProps = {
  link: BoardLinkItem;
  getCanvasRect: () => DOMRect | null;
  onMove: (linkId: string, x: number, y: number) => void;
};

export function BoardLinkCard({
  link,
  getCanvasRect,
  onMove,
}: BoardLinkCardProps) {
  const router = useRouter();
  const movedRef = useRef(false);

  return (
    <div
      draggable
      onDragStart={() => {
        movedRef.current = false;
      }}
      onDrag={() => {
        movedRef.current = true;
      }}
      onDragEnd={(event) => {
        if (!movedRef.current) {
          return;
        }

        const rect = getCanvasRect();

        if (!rect || (event.clientX === 0 && event.clientY === 0)) {
          movedRef.current = false;
          return;
        }

        onMove(link.id, event.clientX - rect.left, event.clientY - rect.top);
        movedRef.current = false;
      }}
      onClick={() => {
        if (movedRef.current) {
          return;
        }

        router.push(`/pizarra/${link.targetBoardId}`);
      }}
      className="board-card absolute h-[7.5rem] w-[11rem] -translate-x-1/2 -translate-y-1/2 cursor-grab overflow-hidden rounded-lg active:cursor-grabbing"
      style={{ left: link.x, top: link.y }}
    >
      <div className="h-2 border-b border-[#ececec] bg-[#f5f5f5]" />
      <div className="h-full bg-white" />
    </div>
  );
}

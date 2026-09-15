"use client";

import { useRef } from "react";
import { useRouter } from "next/navigation";
import { BoardIcon } from "@/components/board-sidebar";
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

        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        movedRef.current = false;
        onMove(link.id, x, y);
      }}
      onClick={() => {
        if (movedRef.current) {
          return;
        }

        router.push(`/pizarra/${link.targetBoardId}`);
      }}
      className="absolute w-44 -translate-x-1/2 -translate-y-1/2 cursor-grab rounded-2xl border border-[#e2d9cc] bg-[#fffdf9] p-3 shadow-[0_10px_30px_rgba(47,42,36,0.08)] transition-[box-shadow,border-color] hover:border-[#cfc4b3] hover:shadow-[0_14px_34px_rgba(47,42,36,0.12)] active:cursor-grabbing"
      style={{ left: link.x, top: link.y }}
    >
      <div className="mb-3 flex size-10 items-center justify-center rounded-xl bg-[#f5f0e8] text-[#7a6f61]">
        <BoardIcon className="size-5" />
      </div>
      <p className="text-sm font-medium text-[#3d3830]">Pizarra</p>
    </div>
  );
}

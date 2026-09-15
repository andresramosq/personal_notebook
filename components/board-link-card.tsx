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

export function BoardLinkCard({
  link,
  interactionEnabled,
  screenToWorld,
  onMove,
  onRename,
}: BoardLinkCardProps) {
  const router = useRouter();
  const movedRef = useRef(false);

  return (
    <div
      draggable={interactionEnabled}
      onDragStart={() => {
        movedRef.current = false;
      }}
      onDrag={() => {
        movedRef.current = true;
      }}
      onDragEnd={(event) => {
        if (!interactionEnabled || !movedRef.current) {
          return;
        }

        if (event.clientX === 0 && event.clientY === 0) {
          movedRef.current = false;
          return;
        }

        const { x, y } = screenToWorld(event.clientX, event.clientY);
        onMove(link.id, x, y);
        movedRef.current = false;
      }}
      onMouseEnter={() => {
        if (interactionEnabled && !link.pending) {
          router.prefetch(`/pizarra/${link.targetBoardId}`);
        }
      }}
      onClick={() => {
        if (!interactionEnabled || link.pending || movedRef.current) {
          return;
        }

        router.push(`/pizarra/${link.targetBoardId}`);
      }}
      className={`board-card absolute h-[7.5rem] w-[11rem] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-lg ${
        interactionEnabled
          ? "cursor-grab active:cursor-grabbing"
          : "pointer-events-none"
      }`}
      style={{ left: link.x, top: link.y }}
    >
      <div className="flex h-7 items-center border-b border-[#ececec] bg-[#fafafa] px-2">
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

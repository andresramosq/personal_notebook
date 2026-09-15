"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { BoardSidebar, PIZARRA_DRAG_TYPE } from "@/components/board-sidebar";

export type BoardLinkItem = {
  id: string;
  targetBoardId: string;
  x: number;
  y: number;
};

type BoardShellProps = {
  boardId: string;
  isHome: boolean;
  initialLinks: BoardLinkItem[];
};

export function BoardShell({ boardId, isHome, initialLinks }: BoardShellProps) {
  const router = useRouter();
  const [links, setLinks] = useState(initialLinks);

  const handleDrop = async (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();

    if (!event.dataTransfer.getData(PIZARRA_DRAG_TYPE)) {
      return;
    }

    const canvas = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - canvas.left;
    const y = event.clientY - canvas.top;

    const response = await fetch(`/api/boards/${boardId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ x, y }),
    });

    if (!response.ok) {
      return;
    }

    const data = (await response.json()) as { link: BoardLinkItem };
    setLinks((current) => [...current, data.link]);
  };

  return (
    <div className="flex h-dvh w-full">
      <BoardSidebar isHome={isHome} />

      <div
        className="relative flex-1 bg-[#f7f3eb]"
        onDragOver={(event) => {
          event.preventDefault();
          event.dataTransfer.dropEffect = "copy";
        }}
        onDrop={(event) => {
          void handleDrop(event);
        }}
      >
        {links.map((link) => (
          <button
            key={link.id}
            type="button"
            onClick={() => router.push(`/pizarra/${link.targetBoardId}`)}
            className="absolute h-28 w-40 -translate-x-1/2 -translate-y-1/2 rounded-xl border-2 border-[#d4cbb8] bg-[#faf7f2] text-sm text-[#3d3830] shadow-sm transition-colors hover:border-[#b8aa92] hover:bg-white"
            style={{ left: link.x, top: link.y }}
          >
            Pizarra
          </button>
        ))}
      </div>
    </div>
  );
}

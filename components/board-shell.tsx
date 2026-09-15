"use client";

import { useRef, useState } from "react";
import { BoardLinkCard } from "@/components/board-link-card";
import { BoardSidebar, PIZARRA_DRAG_TYPE } from "@/components/board-sidebar";

export type BoardLinkItem = {
  id: string;
  targetBoardId: string;
  x: number;
  y: number;
};

type BoardShellProps = {
  boardId: string;
  boardName: string;
  backHref: string | null;
  initialLinks: BoardLinkItem[];
};

export function BoardShell({
  boardId,
  boardName,
  backHref,
  initialLinks,
}: BoardShellProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [links, setLinks] = useState(initialLinks);

  const updateLinkPosition = async (linkId: string, x: number, y: number) => {
    setLinks((current) =>
      current.map((link) => (link.id === linkId ? { ...link, x, y } : link)),
    );

    await fetch(`/api/boards/${boardId}/links/${linkId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ x, y }),
    });
  };

  const handleDrop = async (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();

    if (!event.dataTransfer.getData(PIZARRA_DRAG_TYPE) || !canvasRef.current) {
      return;
    }

    const rect = canvasRef.current.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

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
          onDrop={(event) => {
            void handleDrop(event);
          }}
        >
          <p className="pointer-events-none absolute top-5 left-6 text-[13px] text-[#737373]">
            {boardName}
          </p>

          {links.map((link) => (
            <BoardLinkCard
              key={link.id}
              link={link}
              getCanvasRect={() =>
                canvasRef.current?.getBoundingClientRect() ?? null
              }
              onMove={updateLinkPosition}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

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
  isHome: boolean;
  initialLinks: BoardLinkItem[];
};

export function BoardShell({
  boardId,
  boardName,
  isHome,
  initialLinks,
}: BoardShellProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [links, setLinks] = useState(initialLinks);

  const updateLinkPosition = async (linkId: string, x: number, y: number) => {
    setLinks((current) =>
      current.map((link) =>
        link.id === linkId ? { ...link, x, y } : link,
      ),
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
    <div className="flex h-dvh w-full overflow-hidden bg-[#f5f2eb]">
      <BoardSidebar isHome={isHome} />

      <div className="relative flex min-w-0 flex-1 flex-col">
        <header className="pointer-events-none absolute inset-x-0 top-0 z-10 flex justify-center pt-8">
          <h1 className="border-b border-[#ddd3c4] px-1 pb-1 text-lg font-medium tracking-tight text-[#3d3830]">
            {boardName}
          </h1>
        </header>

        <div
          ref={canvasRef}
          className="board-surface relative h-full w-full"
          onDragOver={(event) => {
            event.preventDefault();
            event.dataTransfer.dropEffect = "copy";
          }}
          onDrop={(event) => {
            void handleDrop(event);
          }}
        >
          {links.map((link) => (
            <BoardLinkCard
              key={link.id}
              link={link}
              getCanvasRect={() => canvasRef.current?.getBoundingClientRect() ?? null}
              onMove={updateLinkPosition}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

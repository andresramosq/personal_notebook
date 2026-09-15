"use client";

import Link from "next/link";

export const PIZARRA_DRAG_TYPE = "application/libreta-pizarra";

function ChevronLeftIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      className="size-4"
      aria-hidden
    >
      <path d="M12 5 7 10l5 5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function BoardPreview() {
  return (
    <div className="board-card-preview h-full w-full overflow-hidden rounded-md">
      <div className="h-2 border-b border-[#ececec] bg-[#f5f5f5]" />
      <div className="h-full bg-white" />
    </div>
  );
}

type BoardSidebarProps = {
  backHref: string | null;
};

export function BoardSidebar({ backHref }: BoardSidebarProps) {
  return (
    <aside className="flex w-14 shrink-0 flex-col items-center border-r border-[#ececec] bg-white py-3">
      {backHref ? (
        <Link
          href={backHref}
          aria-label="Atrás"
          className="sidebar-btn flex size-9 items-center justify-center rounded-md"
        >
          <ChevronLeftIcon />
        </Link>
      ) : (
        <button
          type="button"
          disabled
          aria-label="Atrás"
          className="sidebar-btn flex size-9 items-center justify-center rounded-md"
        >
          <ChevronLeftIcon />
        </button>
      )}

      <div className="mt-auto px-2 pb-1">
        <div
          draggable
          title="Pizarra"
          onDragStart={(event) => {
            event.dataTransfer.setData(PIZARRA_DRAG_TYPE, "pizarra");
            event.dataTransfer.effectAllowed = "copy";
          }}
          className="h-12 w-10 cursor-grab overflow-hidden rounded-md active:cursor-grabbing"
        >
          <BoardPreview />
        </div>
      </div>
    </aside>
  );
}

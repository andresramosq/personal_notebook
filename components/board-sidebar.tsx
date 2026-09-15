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

export function BoardPreview({ className }: { className?: string }) {
  return (
    <div
      className={`board-card-preview overflow-hidden rounded-md ${className ?? ""}`}
    >
      <div className="h-2 border-b border-[#ececec] bg-[#f5f5f5]" />
      <div className="min-h-12 flex-1 bg-white" />
    </div>
  );
}

type BoardSidebarProps = {
  backHref: string | null;
};

export function BoardSidebar({ backHref }: BoardSidebarProps) {
  return (
    <aside className="flex w-48 shrink-0 flex-col border-r border-[#ececec] bg-white">
      <div className="flex h-12 items-center border-b border-[#ececec] px-3">
        {backHref ? (
          <Link
            href={backHref}
            aria-label="Atrás"
            className="sidebar-btn flex size-8 items-center justify-center rounded-md"
          >
            <ChevronLeftIcon />
          </Link>
        ) : (
          <button
            type="button"
            disabled
            aria-label="Atrás"
            className="sidebar-btn flex size-8 items-center justify-center rounded-md"
          >
            <ChevronLeftIcon />
          </button>
        )}
      </div>

      <div className="p-3">
        <div
          draggable
          onDragStart={(event) => {
            event.dataTransfer.setData(PIZARRA_DRAG_TYPE, "pizarra");
            event.dataTransfer.effectAllowed = "copy";
          }}
          className="group cursor-grab rounded-lg p-2 transition-colors hover:bg-[#f5f5f5] active:cursor-grabbing"
        >
          <BoardPreview className="h-20 shadow-sm transition-shadow group-hover:shadow-md" />
          <p className="mt-2 text-center text-[12px] text-[#737373]">Pizarra</p>
        </div>
      </div>
    </aside>
  );
}

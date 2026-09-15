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
      <path d="M12 5 7 10l5.5 5.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function BoardIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      className="size-5"
      aria-hidden
    >
      <rect x="4" y="4" width="16" height="16" rx="2.5" />
      <path
        d="M4 9.5h16M9.5 9.5V20"
        strokeLinecap="round"
      />
    </svg>
  );
}

type BoardSidebarProps = {
  backHref: string | null;
};

export function BoardSidebar({ backHref }: BoardSidebarProps) {
  return (
    <aside className="flex w-[4.75rem] shrink-0 flex-col items-center border-r border-[#ececec] bg-white py-3">
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

      <div
        draggable
        onDragStart={(event) => {
          event.dataTransfer.setData(PIZARRA_DRAG_TYPE, "pizarra");
          event.dataTransfer.effectAllowed = "copy";
        }}
        className="mt-4 flex w-full cursor-grab flex-col items-center gap-1.5 rounded-lg px-1 py-2 transition-colors hover:bg-[#f5f5f5] active:cursor-grabbing"
      >
        <div className="flex size-10 items-center justify-center rounded-lg bg-[#f5f5f5] text-[#525252]">
          <BoardIcon />
        </div>
        <span className="text-[11px] leading-none text-[#737373]">Pizarra</span>
      </div>
    </aside>
  );
}

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

function BoardIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      className="size-4"
      aria-hidden
    >
      <rect x="3.5" y="3.5" width="13" height="13" rx="2" />
      <path d="M7 8h6M7 10.5h4" strokeLinecap="round" />
    </svg>
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

      <div
        draggable
        title="Pizarra"
        onDragStart={(event) => {
          event.dataTransfer.setData(PIZARRA_DRAG_TYPE, "pizarra");
          event.dataTransfer.effectAllowed = "copy";
        }}
        className="sidebar-btn mt-3 flex size-9 cursor-grab items-center justify-center rounded-md active:cursor-grabbing"
      >
        <BoardIcon />
      </div>
    </aside>
  );
}

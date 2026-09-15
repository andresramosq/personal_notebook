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

function HandIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      className="size-5"
      aria-hidden
    >
      <path
        d="M8 9.5V6.5a1.5 1.5 0 1 1 3 0V12M11 7.5V5a1.5 1.5 0 1 1 3 0v7M14 8.5V6a1.5 1.5 0 1 1 3 0v8.5a5.5 5.5 0 0 1-11 0V12.5a1.5 1.5 0 0 1 3 0V14"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
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
      <path d="M4 9.5h16M9.5 9.5V20" strokeLinecap="round" />
    </svg>
  );
}

type BoardSidebarProps = {
  backHref: string | null;
  handToolActive: boolean;
  onToggleHandTool: () => void;
};

export function BoardSidebar({
  backHref,
  handToolActive,
  onToggleHandTool,
}: BoardSidebarProps) {
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

      <button
        type="button"
        aria-label="Mano"
        aria-pressed={handToolActive}
        onClick={onToggleHandTool}
        className={`mt-3 flex w-full flex-col items-center gap-1.5 rounded-lg px-1 py-2 transition-colors ${
          handToolActive
            ? "bg-[#eef2ff] text-[#4338ca]"
            : "text-[#525252] hover:bg-[#f5f5f5]"
        }`}
      >
        <div
          className={`flex size-10 items-center justify-center rounded-lg ${
            handToolActive ? "bg-[#e0e7ff]" : "bg-[#f5f5f5]"
          }`}
        >
          <HandIcon />
        </div>
        <span className="text-[11px] leading-none text-current">Mano</span>
      </button>

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

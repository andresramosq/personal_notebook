"use client";

import Link from "next/link";

export const PIZARRA_DRAG_TYPE = "application/libreta-pizarra";

function BoardIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      className={className}
      aria-hidden
    >
      <rect x="4" y="4" width="16" height="16" rx="3" />
      <path d="M8 9h8M8 12h5" strokeLinecap="round" />
    </svg>
  );
}

function BackIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      className={className}
      aria-hidden
    >
      <path
        d="M14.5 6.5 9 12l5.5 5.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

type BoardSidebarProps = {
  backHref: string | null;
};

export function BoardSidebar({ backHref }: BoardSidebarProps) {
  return (
    <aside className="flex w-[17.5rem] shrink-0 flex-col border-r border-[#e8e0d4] bg-[#faf8f4]">
      <div className="flex h-14 items-center gap-3 border-b border-[#e8e0d4] px-4">
        <div className="flex size-8 items-center justify-center rounded-lg bg-[#f0ebe3] text-[#6f6558]">
          <BoardIcon className="size-4" />
        </div>
        <span className="text-[15px] font-semibold tracking-tight text-[#2f2a24]">
          Libreta
        </span>
      </div>

      <div className="border-b border-[#e8e0d4] p-2">
        {backHref ? (
          <Link
            href={backHref}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-[#4a433b] transition-colors hover:bg-[#f0ebe3]"
          >
            <BackIcon className="size-4" />
            Atrás
          </Link>
        ) : (
          <button
            type="button"
            disabled
            aria-label="Atrás"
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-[#b4aa9c] disabled:cursor-default"
          >
            <BackIcon className="size-4" />
            Atrás
          </button>
        )}
      </div>

      <div className="p-3">
        <p className="mb-3 px-1 text-[11px] font-medium tracking-[0.14em] text-[#9a9083] uppercase">
          Elementos
        </p>
        <div
          draggable
          onDragStart={(event) => {
            event.dataTransfer.setData(PIZARRA_DRAG_TYPE, "pizarra");
            event.dataTransfer.effectAllowed = "copy";
          }}
          className="group cursor-grab rounded-2xl border border-[#e2d9cc] bg-[#fffdf9] p-3 shadow-[0_1px_2px_rgba(47,42,36,0.04)] transition-[box-shadow,border-color,transform] hover:border-[#d4cabb] hover:shadow-[0_8px_20px_rgba(47,42,36,0.06)] active:cursor-grabbing active:scale-[0.98]"
        >
          <div className="mb-3 flex size-10 items-center justify-center rounded-xl bg-[#f5f0e8] text-[#7a6f61] transition-colors group-hover:bg-[#ece4d8]">
            <BoardIcon className="size-5" />
          </div>
          <p className="text-sm font-medium text-[#3d3830]">Pizarra</p>
        </div>
      </div>
    </aside>
  );
}

export { BoardIcon };

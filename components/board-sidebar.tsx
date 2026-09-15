"use client";

import Link from "next/link";

const PIZARRA_DRAG_TYPE = "application/pizarra";

type BoardSidebarProps = {
  isHome: boolean;
};

export function BoardSidebar({ isHome }: BoardSidebarProps) {
  return (
    <aside className="flex w-56 shrink-0 flex-col border-r border-[#e5ded0] bg-[#faf7f2]">
      <div className="border-b border-[#e5ded0] p-3">
        {isHome ? (
          <button
            type="button"
            disabled
            className="w-full rounded-lg px-3 py-2 text-left text-sm text-[#9a9083] disabled:cursor-not-allowed"
          >
            ← Atrás
          </button>
        ) : (
          <Link
            href="/"
            className="block w-full rounded-lg px-3 py-2 text-left text-sm text-[#3d3830] transition-colors hover:bg-[#efe8dc]"
          >
            ← Atrás
          </Link>
        )}
      </div>

      <div className="p-3">
        <p className="mb-2 text-xs font-medium tracking-wide text-[#9a9083] uppercase">
          Objetos
        </p>
        <div
          draggable
          onDragStart={(event) => {
            event.dataTransfer.setData(PIZARRA_DRAG_TYPE, "pizarra");
            event.dataTransfer.effectAllowed = "copy";
          }}
          className="flex h-24 cursor-grab items-center justify-center rounded-xl border-2 border-dashed border-[#d4cbb8] bg-[#f7f3eb] text-sm text-[#3d3830] active:cursor-grabbing"
        >
          Pizarra
        </div>
        <p className="mt-2 text-xs text-[#9a9083]">
          Arrástrala al lienzo para crear otra pizarra.
        </p>
      </div>
    </aside>
  );
}

export { PIZARRA_DRAG_TYPE };

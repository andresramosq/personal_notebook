"use client";

import { useState } from "react";

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

function ChevronRightIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      className="size-4"
      aria-hidden
    >
      <path d="M8 5l5 5-5 5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function Home() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <main className="flex h-dvh w-full overflow-hidden bg-[#e8e8e8]">
      {sidebarOpen ? (
        <aside className="relative w-[4.75rem] shrink-0 border-r border-[#d4d4d4] bg-white">
          <button
            type="button"
            aria-label="Cerrar panel"
            onClick={() => setSidebarOpen(false)}
            className="absolute top-0 right-0 flex h-12 w-12 items-center justify-center text-[#525252] hover:bg-[#f5f5f5]"
          >
            <ChevronLeftIcon />
          </button>
        </aside>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-12 shrink-0 border-b border-[#d4d4d4] bg-white shadow-sm">
          {!sidebarOpen ? (
            <div className="flex h-12 w-[4.75rem] shrink-0 justify-end">
              <button
                type="button"
                aria-label="Abrir panel"
                onClick={() => setSidebarOpen(true)}
                className="flex h-12 w-12 items-center justify-center text-[#525252] hover:bg-[#f5f5f5]"
              >
                <ChevronRightIcon />
              </button>
            </div>
          ) : null}
        </header>
      </div>
    </main>
  );
}

"use client";

import { useState } from "react";

const TOGGLE_BUTTON_CLASS =
  "flex h-12 w-[4.75rem] shrink-0 items-center justify-end px-3 text-[#525252] hover:bg-[#f5f5f5]";

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
        <aside className="w-[4.75rem] shrink-0 border-r border-[#d4d4d4] bg-white">
          <button
            type="button"
            aria-label="Cerrar panel"
            onClick={() => setSidebarOpen(false)}
            className={`${TOGGLE_BUTTON_CLASS} border-b border-[#d4d4d4]`}
          >
            <ChevronLeftIcon />
          </button>
        </aside>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-12 shrink-0 border-b border-[#d4d4d4] bg-white shadow-sm">
          {!sidebarOpen ? (
            <button
              type="button"
              aria-label="Abrir panel"
              onClick={() => setSidebarOpen(true)}
              className={`${TOGGLE_BUTTON_CLASS} border-r border-[#d4d4d4]`}
            >
              <ChevronRightIcon />
            </button>
          ) : null}
        </header>
      </div>
    </main>
  );
}

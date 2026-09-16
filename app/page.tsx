"use client";

import { useState } from "react";

const ICON_BUTTON_CLASS =
  "flex h-12 w-12 cursor-pointer items-center justify-center rounded-md text-[#525252] transition-colors hover:bg-[#f5f5f5]";

function PanelCloseIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      className="size-5"
      aria-hidden
    >
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M9 3v18" strokeLinecap="round" />
      <path d="m14 15-3-3 3-3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PanelOpenIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      className="size-5"
      aria-hidden
    >
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M9 3v18" strokeLinecap="round" />
      <path d="m10 9 3 3-3 3" strokeLinecap="round" strokeLinejoin="round" />
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
            className={`${ICON_BUTTON_CLASS} absolute top-0 right-0`}
          >
            <PanelCloseIcon />
          </button>
        </aside>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-12 shrink-0 items-center border-b border-[#d4d4d4] bg-white shadow-sm">
          {!sidebarOpen ? (
            <button
              type="button"
              aria-label="Abrir panel"
              onClick={() => setSidebarOpen(true)}
              className={`${ICON_BUTTON_CLASS} ml-1`}
            >
              <PanelOpenIcon />
            </button>
          ) : null}
        </header>
      </div>
    </main>
  );
}

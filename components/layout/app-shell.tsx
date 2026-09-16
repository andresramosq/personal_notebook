"use client";

import { useState } from "react";
import { PanelOpenIcon } from "@/components/icons/panel-open-icon";
import { Sidebar } from "@/components/sidebar/sidebar";
import type { BoardRecord } from "@/lib/boards";

const ICON_BUTTON_CLASS =
  "flex h-12 w-12 cursor-pointer items-center justify-center rounded-md text-[#525252] transition-colors hover:bg-[#f5f5f5]";

type AppShellProps = {
  initialBoards: BoardRecord[];
};

export function AppShell({ initialBoards }: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <main className="flex h-dvh w-full overflow-hidden bg-[#e8e8e8]">
      {sidebarOpen ? (
        <Sidebar
          initialBoards={initialBoards}
          onClose={() => setSidebarOpen(false)}
        />
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

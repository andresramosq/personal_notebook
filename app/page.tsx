import { BoardCanvas } from "@/components/board-canvas";

const SHOW_BOARD = false;

export default function Home() {
  return (
    <main className="flex h-dvh w-full flex-col overflow-hidden bg-[#e8e8e8]">
      <header className="h-12 shrink-0 border-b border-[#d4d4d4] bg-white shadow-sm" />

      {SHOW_BOARD ? <BoardCanvas className="min-h-0 flex-1" /> : null}
    </main>
  );
}

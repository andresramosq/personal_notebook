import { BoardCanvas } from "@/components/board-canvas";

const SHOW_BOARD = false;

export default function Home() {
  return (
    <main className="flex h-dvh w-full flex-col overflow-hidden">
      <header className="h-12 shrink-0 border-b border-[#ececec] bg-white" />

      {SHOW_BOARD ? <BoardCanvas className="min-h-0 flex-1" /> : null}
    </main>
  );
}

const BOARD_WIDTH = 1280;
const BOARD_HEIGHT = 720;

export default function Home() {
  return (
    <main className="flex h-dvh items-center justify-center bg-[#e8e8e8]">
      <div
        className="board-surface border border-[#d4d4d4] bg-[#fafafa] shadow-sm"
        style={{ width: BOARD_WIDTH, height: BOARD_HEIGHT }}
      />
    </main>
  );
}

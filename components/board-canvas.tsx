export const BOARD_CANVAS = {
  width: 1280,
  height: 720,
} as const;

type BoardCanvasProps = {
  className?: string;
};

export function BoardCanvas({ className = "" }: BoardCanvasProps) {
  return (
    <div
      className={`board-surface border border-[#d4d4d4] bg-[#fafafa] shadow-sm ${className}`}
      style={{
        width: BOARD_CANVAS.width,
        height: BOARD_CANVAS.height,
      }}
    />
  );
}

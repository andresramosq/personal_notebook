export const BOARD_CANVAS = {
  width: 1280,
  height: 720,
  gridSize: 24,
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
        backgroundSize: `${BOARD_CANVAS.gridSize}px ${BOARD_CANVAS.gridSize}px`,
      }}
    />
  );
}

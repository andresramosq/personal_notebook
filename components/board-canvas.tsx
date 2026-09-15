"use client";

import { useEffect, useRef, useState } from "react";

export const BOARD_CANVAS = {
  width: 1280,
  height: 720,
  gridSize: 24,
} as const;

const MIN_ZOOM = 0.5;
const MAX_ZOOM = 2.5;

type BoardCanvasProps = {
  className?: string;
};

export function BoardCanvas({ className = "" }: BoardCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const boardRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const zoomRef = useRef(zoom);
  const panRef = useRef(pan);

  useEffect(() => {
    zoomRef.current = zoom;
  }, [zoom]);

  useEffect(() => {
    panRef.current = pan;
  }, [pan]);

  useEffect(() => {
    const board = boardRef.current;

    if (!board) {
      return;
    }

    const handleWheel = (event: WheelEvent) => {
      event.preventDefault();
      event.stopPropagation();

      const container = containerRef.current;

      if (!container) {
        return;
      }

      const rect = container.getBoundingClientRect();
      const mouseX = event.clientX - rect.left;
      const mouseY = event.clientY - rect.top;
      const currentZoom = zoomRef.current;
      const currentPan = panRef.current;
      const zoomFactor = event.deltaY > 0 ? 0.92 : 1.08;
      const nextZoom = Math.min(
        MAX_ZOOM,
        Math.max(MIN_ZOOM, currentZoom * zoomFactor),
      );
      const worldX = (mouseX - currentPan.x) / currentZoom;
      const worldY = (mouseY - currentPan.y) / currentZoom;

      setZoom(nextZoom);
      setPan({
        x: mouseX - worldX * nextZoom,
        y: mouseY - worldY * nextZoom,
      });
    };

    board.addEventListener("wheel", handleWheel, { passive: false });

    return () => board.removeEventListener("wheel", handleWheel);
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative overflow-visible"
      style={{
        width: BOARD_CANVAS.width,
        height: BOARD_CANVAS.height,
      }}
    >
      <div
        ref={boardRef}
        className={`board-surface absolute top-0 left-0 border border-[#d4d4d4] bg-[#fafafa] shadow-sm ${className}`}
        style={{
          width: BOARD_CANVAS.width,
          height: BOARD_CANVAS.height,
          backgroundSize: `${BOARD_CANVAS.gridSize}px ${BOARD_CANVAS.gridSize}px`,
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: "0 0",
        }}
      />
    </div>
  );
}

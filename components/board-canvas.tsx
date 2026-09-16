"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { BoardCanvasContext } from "@/components/board/board-canvas-context";
import { BoardCanvasCardPreview } from "@/components/board/board-canvas-card";

export const BOARD_CANVAS = {
  gridSize: 24,
} as const;

const MIN_ZOOM = 0.5;
const MAX_ZOOM = 2.5;

export type BoardCanvasHandle = {
  screenToWorld: (clientX: number, clientY: number) => { x: number; y: number };
  isOverCanvas: (clientX: number, clientY: number) => boolean;
};

type BoardCanvasProps = {
  className?: string;
  children?: React.ReactNode;
  placementPreview?: { x: number; y: number; name?: string } | null;
};

export const BoardCanvas = forwardRef<BoardCanvasHandle, BoardCanvasProps>(
  function BoardCanvas({ className = "", children, placementPreview }, ref) {
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

    useImperativeHandle(ref, () => ({
      screenToWorld(clientX: number, clientY: number) {
        const container = containerRef.current;

        if (!container) {
          return { x: 0, y: 0 };
        }

        const rect = container.getBoundingClientRect();
        const screenX = clientX - rect.left;
        const screenY = clientY - rect.top;

        return {
          x: (screenX - panRef.current.x) / zoomRef.current,
          y: (screenY - panRef.current.y) / zoomRef.current,
        };
      },
      isOverCanvas(clientX: number, clientY: number) {
        const container = containerRef.current;

        if (!container) {
          return false;
        }

        const rect = container.getBoundingClientRect();

        return (
          clientX >= rect.left &&
          clientX <= rect.right &&
          clientY >= rect.top &&
          clientY <= rect.bottom
        );
      },
    }));

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

        zoomRef.current = nextZoom;
        panRef.current = {
          x: mouseX - worldX * nextZoom,
          y: mouseY - worldY * nextZoom,
        };

        setZoom(nextZoom);
        setPan(panRef.current);
      };

      board.addEventListener("wheel", handleWheel, { passive: false });

      return () => board.removeEventListener("wheel", handleWheel);
    }, []);

    return (
      <BoardCanvasContext value={{ getZoom: () => zoomRef.current }}>
        <div
          ref={containerRef}
          className={`relative h-full w-full overflow-hidden ${className}`}
        >
          <div
            ref={boardRef}
            className="board-surface absolute top-0 left-0 h-full w-full bg-[#fafafa]"
            style={{
              backgroundSize: `${BOARD_CANVAS.gridSize}px ${BOARD_CANVAS.gridSize}px`,
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: "0 0",
            }}
          >
            {children}
            {placementPreview ? (
              <BoardCanvasCardPreview
                x={placementPreview.x}
                y={placementPreview.y}
                name={placementPreview.name}
              />
            ) : null}
          </div>
        </div>
      </BoardCanvasContext>
    );
  },
);

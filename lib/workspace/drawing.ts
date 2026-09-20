import type { DrawingPoint } from "@/lib/workspace/types";

export function normalizeDrawingPoints(points: DrawingPoint[]) {
  if (!points.length) {
    return {
      x: 0,
      y: 0,
      width: 1,
      height: 1,
      points: [] as DrawingPoint[],
    };
  }

  const xs = points.map((point) => point.x);
  const ys = points.map((point) => point.y);
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  const maxX = Math.max(...xs);
  const maxY = Math.max(...ys);

  return {
    x: minX,
    y: minY,
    width: Math.max(20, maxX - minX),
    height: Math.max(20, maxY - minY),
    points: points.map((point) => ({
      x: point.x - minX,
      y: point.y - minY,
    })),
  };
}

export function drawingPath(points: DrawingPoint[]) {
  return points
    .map((point, index) => `${index ? "L" : "M"} ${point.x} ${point.y}`)
    .join(" ");
}

export function linkCurvePath(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
) {
  const distance = Math.abs(x2 - x1);
  const curve = Math.max(40, distance * 0.35);
  const cx1 = x1 + curve;
  const cy1 = y1;
  const cx2 = x2 - curve;
  const cy2 = y2;
  return `M ${x1} ${y1} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${x2} ${y2}`;
}

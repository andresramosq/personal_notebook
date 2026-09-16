"use client";

import { createContext, useContext } from "react";

type BoardCanvasContextValue = {
  getZoom: () => number;
};

export const BoardCanvasContext = createContext<BoardCanvasContextValue>({
  getZoom: () => 1,
});

export function useBoardCanvas() {
  return useContext(BoardCanvasContext);
}

"use client";

import { Layout } from "lucide-react";

type BoardPaletteButtonProps = {
  canPlaceOnCanvas: boolean;
  onCreateRoot: () => void;
  onStartPlacement: (event: React.PointerEvent<HTMLButtonElement>) => void;
};

export function BoardPaletteButton({
  canPlaceOnCanvas,
  onCreateRoot,
  onStartPlacement,
}: BoardPaletteButtonProps) {
  return (
    <button
      type="button"
      aria-label="Crear pizarra"
      onClick={(event) => {
        if (canPlaceOnCanvas) {
          event.preventDefault();
          return;
        }

        onCreateRoot();
      }}
      onPointerDown={(event) => {
        if (!canPlaceOnCanvas || event.button !== 0) {
          return;
        }

        event.preventDefault();
        event.stopPropagation();
        onStartPlacement(event);
      }}
      className={`flex w-full touch-none flex-col items-center gap-1.5 rounded-lg py-2 text-[#525252] transition-colors hover:bg-[#f5f5f5] ${
        canPlaceOnCanvas
          ? "cursor-grab active:cursor-grabbing"
          : "cursor-pointer"
      }`}
    >
      <Layout className="size-5" strokeWidth={1.5} />
      <span className="text-[11px] leading-none">
        {canPlaceOnCanvas ? "Arrastra" : "Pizarra"}
      </span>
    </button>
  );
}

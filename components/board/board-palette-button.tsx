"use client";

import { Layout } from "lucide-react";

type BoardPaletteButtonProps = {
  onCreate: () => void;
  onStartPlacement?: (event: React.PointerEvent<HTMLButtonElement>) => void;
};

export function BoardPaletteButton({
  onCreate,
  onStartPlacement,
}: BoardPaletteButtonProps) {
  return (
    <button
      type="button"
      aria-label="Crear pizarra"
      onClick={onCreate}
      onPointerDown={(event) => {
        if (!onStartPlacement || event.button !== 0) {
          return;
        }

        onStartPlacement(event);
      }}
      className="flex w-full cursor-pointer flex-col items-center gap-1.5 rounded-lg py-2 text-[#525252] transition-colors hover:bg-[#f5f5f5]"
    >
      <Layout className="size-5" strokeWidth={1.5} />
      <span className="text-[11px] leading-none">Pizarra</span>
    </button>
  );
}

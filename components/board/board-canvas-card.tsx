"use client";

import { BoardName } from "@/components/board/board-name";

type BoardCanvasCardProps = {
  name: string;
  x: number;
  y: number;
  isEditing: boolean;
  onOpen: () => void;
  onContextMenu: (event: React.MouseEvent<HTMLDivElement>) => void;
  onRequestEdit: () => void;
  onFinishEditing: () => void;
  onSave: (name: string) => void;
};

export function BoardCanvasCard({
  name,
  x,
  y,
  isEditing,
  onOpen,
  onContextMenu,
  onRequestEdit,
  onFinishEditing,
  onSave,
}: BoardCanvasCardProps) {
  return (
    <div
      className="absolute h-28 w-40 overflow-hidden rounded-lg border border-[#d4d4d4] bg-white shadow-sm"
      style={{ left: x, top: y }}
      onContextMenu={onContextMenu}
    >
      <div className="flex h-7 items-center border-b border-[#ececec] bg-[#fafafa] px-2">
        <BoardName
          value={name}
          isEditing={isEditing}
          editOnClick
          onRequestEdit={onRequestEdit}
          onFinishEditing={onFinishEditing}
          onSave={onSave}
          className="min-w-0 flex-1 cursor-text truncate text-left text-[11px] font-medium text-[#525252]"
          inputClassName="w-full rounded border border-[#d4d4d4] bg-white px-1.5 py-0.5 text-[11px] text-[#404040] outline-none focus:border-[#a3a3a3]"
        />
      </div>
      <button
        type="button"
        aria-label={`Abrir ${name}`}
        onClick={onOpen}
        className="block h-[calc(100%-1.75rem)] w-full cursor-pointer bg-white hover:bg-[#fcfcfc]"
      />
    </div>
  );
}

"use client";

import { Layout } from "lucide-react";
import { BoardName } from "@/components/board/board-name";

type BoardSidebarItemProps = {
  name: string;
  isActive: boolean;
  isEditing: boolean;
  onOpen: () => void;
  onPrefetch?: () => void;
  onContextMenu: (event: React.MouseEvent<HTMLButtonElement>) => void;
  onRequestEdit: () => void;
  onFinishEditing: () => void;
  onSave: (name: string) => void;
};

export function BoardSidebarItem({
  name,
  isActive,
  isEditing,
  onOpen,
  onPrefetch,
  onContextMenu,
  onRequestEdit,
  onFinishEditing,
  onSave,
}: BoardSidebarItemProps) {
  return (
    <button
      type="button"
      onClick={onOpen}
      onMouseEnter={onPrefetch}
      onContextMenu={onContextMenu}
      className={`flex min-w-0 cursor-pointer items-center gap-1 rounded-md px-1 py-1.5 text-left hover:bg-[#f5f5f5] ${
        isActive ? "bg-[#f5f5f5]" : ""
      }`}
    >
      <Layout className="size-3.5 shrink-0 text-[#737373]" strokeWidth={1.5} />
      <BoardName
        value={name}
        isEditing={isEditing}
        onRequestEdit={onRequestEdit}
        onFinishEditing={onFinishEditing}
        onSave={onSave}
      />
    </button>
  );
}

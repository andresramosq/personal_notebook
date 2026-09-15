"use client";

import { useRouter } from "next/navigation";
import { useRef } from "react";
import { EditableName } from "@/components/editable-name";
import type { BoardLinkItem } from "@/components/board-shell";

type BoardLinkCardProps = {
  link: BoardLinkItem;
  selected: boolean;
  selectMode: boolean;
  screenToWorld: (clientX: number, clientY: number) => { x: number; y: number };
  onSelect: (linkId: string) => void;
  onMovePreview: (linkId: string, x: number, y: number) => void;
  onMoveCommit: (linkId: string, x: number, y: number) => void;
  onRename: (targetBoardId: string, name: string) => void;
};

function DragHandleIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="currentColor"
      className="size-3.5 opacity-40"
      aria-hidden
    >
      <circle cx="5" cy="4" r="1" />
      <circle cx="11" cy="4" r="1" />
      <circle cx="5" cy="8" r="1" />
      <circle cx="11" cy="8" r="1" />
      <circle cx="5" cy="12" r="1" />
      <circle cx="11" cy="12" r="1" />
    </svg>
  );
}

export function BoardLinkCard({
  link,
  selected,
  selectMode,
  screenToWorld,
  onSelect,
  onMovePreview,
  onMoveCommit,
  onRename,
}: BoardLinkCardProps) {
  const router = useRouter();
  const draggingRef = useRef(false);
  const movedRef = useRef(false);

  const openBoard = () => {
    if (!selectMode || link.pending) {
      return;
    }

    router.push(`/pizarra/${link.targetBoardId}`);
  };

  const handleGripPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!selectMode || link.pending) {
      return;
    }

    draggingRef.current = true;
    movedRef.current = false;
    onSelect(link.id);
    event.currentTarget.setPointerCapture(event.pointerId);
    event.preventDefault();
    event.stopPropagation();
  };

  const handleGripPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current || !selectMode) {
      return;
    }

    movedRef.current = true;
    const { x, y } = screenToWorld(event.clientX, event.clientY);
    onMovePreview(link.id, x, y);
  };

  const finishDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current) {
      return;
    }

    draggingRef.current = false;

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    const { x, y } = screenToWorld(event.clientX, event.clientY);
    onMoveCommit(link.id, x, y);
  };

  const handleBodyPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!selectMode || link.pending) {
      return;
    }

    movedRef.current = false;
    onSelect(link.id);
    event.stopPropagation();
  };

  const handleBodyClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!selectMode || link.pending || movedRef.current) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    openBoard();
  };

  return (
    <div
      className={`board-card absolute h-[7.5rem] w-[11rem] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-lg ${
        selectMode ? "" : "pointer-events-none"
      } ${selected ? "ring-2 ring-[#6366f1] ring-offset-1" : ""}`}
      style={{ left: link.x, top: link.y }}
    >
      <div className="flex h-7 items-center border-b border-[#ececec] bg-[#fafafa]">
        <div
          onPointerDown={handleGripPointerDown}
          onPointerMove={handleGripPointerMove}
          onPointerUp={finishDrag}
          onPointerCancel={finishDrag}
          className={`flex h-full shrink-0 items-center px-1.5 ${
            selectMode && !link.pending
              ? "cursor-grab text-[#737373] active:cursor-grabbing"
              : ""
          }`}
          aria-label="Mover pizarra"
        >
          <DragHandleIcon />
        </div>
        <div className="min-w-0 flex-1 px-1">
          {link.pending ? (
            <span className="block w-full truncate text-left text-[11px] font-medium text-[#737373]">
              {link.name}
            </span>
          ) : (
            <EditableName
              value={link.name}
              onSave={(name) => onRename(link.targetBoardId, name)}
              className="w-full truncate text-left text-[11px] font-medium text-[#525252] hover:text-[#171717]"
              inputClassName="w-full rounded border border-[#d4d4d4] bg-white px-1.5 py-0.5 text-[11px] text-[#404040] outline-none focus:border-[#a3a3a3]"
            />
          )}
        </div>
      </div>

      <div
        role="button"
        tabIndex={selectMode && !link.pending ? 0 : -1}
        onPointerDown={handleBodyPointerDown}
        onClick={handleBodyClick}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            openBoard();
          }
        }}
        className={`h-[calc(100%-1.75rem)] bg-white transition-colors ${
          selectMode && !link.pending
            ? "cursor-pointer hover:bg-[#fcfcfc]"
            : ""
        }`}
        aria-label={`Abrir ${link.name}`}
      />
    </div>
  );
}

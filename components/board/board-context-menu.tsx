"use client";

const MENU_ITEM_CLASS =
  "block w-full cursor-pointer px-3 py-1.5 text-left text-[13px] text-[#404040] hover:bg-[#f5f5f5]";

type BoardContextMenuProps = {
  x: number;
  y: number;
  onEdit: () => void;
  onDelete: () => void;
};

export function BoardContextMenu({
  x,
  y,
  onEdit,
  onDelete,
}: BoardContextMenuProps) {
  return (
    <div
      className="fixed z-50 min-w-[10rem] overflow-hidden rounded-md border border-[#d4d4d4] bg-white py-1 shadow-lg"
      style={{ left: x, top: y }}
      onClick={(event) => event.stopPropagation()}
    >
      <button type="button" className={MENU_ITEM_CLASS} onClick={onEdit}>
        Editar nombre
      </button>
      <button
        type="button"
        className={`${MENU_ITEM_CLASS} text-[#dc2626] hover:bg-[#fef2f2]`}
        onClick={onDelete}
      >
        Eliminar
      </button>
    </div>
  );
}

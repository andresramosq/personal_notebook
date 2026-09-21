"use client";

import { Icon } from "@/components/system/icon";

type CanvasSelectionBarProps = {
  onDuplicate: () => void;
  onDelete: () => void;
  onConnect: () => void;
};

export function CanvasSelectionBar({
  onDuplicate,
  onDelete,
  onConnect,
}: CanvasSelectionBarProps) {
  return (
    <div className="selection-bar">
      <button type="button" onClick={onDuplicate}>
        <Icon name="copy" size={15} />
        Duplicar
      </button>
      <button type="button" onClick={onConnect}>
        <Icon name="line" size={15} />
        Conectar
      </button>
      <button type="button" className="danger" onClick={onDelete}>
        <Icon name="trash" size={15} />
        Eliminar
      </button>
    </div>
  );
}

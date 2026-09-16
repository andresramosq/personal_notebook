"use client";

type BoardNameProps = {
  value: string;
  isEditing: boolean;
  onRequestEdit: () => void;
  onFinishEditing: () => void;
  onSave: (name: string) => void;
  editOnClick?: boolean;
  className?: string;
  inputClassName?: string;
};

export function BoardName({
  value,
  isEditing,
  onRequestEdit,
  onFinishEditing,
  onSave,
  editOnClick = false,
  className = "min-w-0 flex-1 truncate text-left text-[11px] text-[#404040]",
  inputClassName = "min-w-0 flex-1 rounded border border-[#d4d4d4] bg-white px-1 py-0.5 text-[11px] text-[#404040] outline-none focus:border-[#a3a3a3]",
}: BoardNameProps) {
  if (isEditing) {
    return (
      <input
        data-board-name=""
        autoFocus
        defaultValue={value}
        onPointerDown={(event) => event.stopPropagation()}
        onClick={(event) => event.stopPropagation()}
        onBlur={(event) => {
          const trimmed = event.target.value.trim();

          if (trimmed && trimmed !== value) {
            onSave(trimmed);
          }

          onFinishEditing();
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            event.currentTarget.blur();
          }

          if (event.key === "Escape") {
            onFinishEditing();
          }
        }}
        className={inputClassName}
      />
    );
  }

  return (
    <span
      data-board-name=""
      title={value}
      onPointerDown={(event) => event.stopPropagation()}
      onClick={(event) => {
        event.stopPropagation();

        if (editOnClick) {
          onRequestEdit();
        }
      }}
      onDoubleClick={(event) => {
        event.stopPropagation();

        if (!editOnClick) {
          onRequestEdit();
        }
      }}
      className={className}
    >
      {value}
    </span>
  );
}

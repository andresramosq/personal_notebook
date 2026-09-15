"use client";

import { useEffect, useRef, useState } from "react";

type EditableNameProps = {
  value: string;
  onSave: (name: string) => void;
  className?: string;
  inputClassName?: string;
};

export function EditableName({
  value,
  onSave,
  className,
  inputClassName,
}: EditableNameProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing]);

  const startEditing = () => {
    setDraft(value);
    setEditing(true);
  };

  const save = () => {
    const trimmed = draft.trim();

    if (!trimmed) {
      setEditing(false);
      return;
    }

    if (trimmed !== value) {
      onSave(trimmed);
    }

    setEditing(false);
  };

  if (editing) {
    return (
      <input
        ref={inputRef}
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={save}
        onClick={(event) => event.stopPropagation()}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            save();
          }

          if (event.key === "Escape") {
            setEditing(false);
          }
        }}
        className={
          inputClassName ??
          "w-full rounded border border-[#d4d4d4] bg-white px-2 py-1 text-[12px] text-[#404040] outline-none focus:border-[#a3a3a3]"
        }
      />
    );
  }

  return (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        startEditing();
      }}
      className={
        className ??
        "truncate text-left text-[12px] text-[#525252] hover:text-[#171717]"
      }
    >
      {value}
    </button>
  );
}

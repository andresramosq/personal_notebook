"use client";

import { useRef, useState } from "react";

type EditableNameProps = {
  value: string;
  onSave: (name: string) => void;
};

export function EditableName({ value, onSave }: EditableNameProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  const startEditing = () => {
    setDraft(value);
    setEditing(true);
    requestAnimationFrame(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    });
  };

  const save = () => {
    const trimmed = draft.trim();

    if (!trimmed || trimmed === value) {
      setDraft(value);
      setEditing(false);
      return;
    }

    onSave(trimmed);
    setEditing(false);
  };

  if (editing) {
    return (
      <input
        ref={inputRef}
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={save}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            save();
          }

          if (event.key === "Escape") {
            setDraft(value);
            setEditing(false);
          }
        }}
        className="min-w-0 flex-1 rounded border border-[#d4d4d4] bg-white px-1.5 py-0.5 text-[13px] text-[#404040] outline-none focus:border-[#a3a3a3]"
      />
    );
  }

  return (
    <button
      type="button"
      onClick={startEditing}
      className="min-w-0 flex-1 truncate text-left text-[13px] text-[#404040] hover:text-[#171717]"
    >
      {value}
    </button>
  );
}

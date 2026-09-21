"use client";

import { useState } from "react";
import { createId } from "@/lib/workspace/id";
import {
  parseCommentContent,
  type CommentBlock,
} from "@/lib/workspace/blocks";

type BlockCommentProps = {
  content: string;
  onChange: (content: string) => void;
};

export function BlockComment({ content, onChange }: BlockCommentProps) {
  const block = parseCommentContent(content);
  const [draft, setDraft] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);

  const save = (next: CommentBlock) => {
    onChange(JSON.stringify(next));
  };

  const postMessage = () => {
    const text = draft.trim();
    if (!text) return;
    save({
      messages: [
        ...block.messages,
        {
          id: createId(),
          text,
          parentId: replyTo,
          createdAt: Date.now(),
        },
      ],
    });
    setDraft("");
    setReplyTo(null);
  };

  const roots = block.messages.filter((message) => !message.parentId);
  const repliesFor = (parentId: string) =>
    block.messages.filter((message) => message.parentId === parentId);

  const renderThread = (messageId: string, depth = 0) => {
    const message = block.messages.find((entry) => entry.id === messageId);
    if (!message) return null;
    return (
      <div key={message.id} style={{ marginLeft: depth * 16 }}>
        <div className="comment-message">
          <p>{message.text}</p>
          <button
            type="button"
            onPointerDown={(event) => event.stopPropagation()}
            onClick={() => setReplyTo(message.id)}
          >
            Responder
          </button>
        </div>
        {repliesFor(message.id).map((reply) => renderThread(reply.id, depth + 1))}
      </div>
    );
  };

  return (
    <div className="block-comment">
      <div className="comment-thread">
        {roots.length ? (
          roots.map((message) => renderThread(message.id))
        ) : (
          <span className="comment-empty">Sin comentarios todavía</span>
        )}
      </div>
      {replyTo ? (
        <span className="comment-replying">Respondiendo…</span>
      ) : null}
      <textarea
        className="comment-draft"
        value={draft}
        placeholder="Escribe un comentario"
        onPointerDown={(event) => event.stopPropagation()}
        onChange={(event) => setDraft(event.target.value)}
      />
      <button
        type="button"
        className="comment-send"
        onPointerDown={(event) => event.stopPropagation()}
        onClick={postMessage}
      >
        Enviar
      </button>
    </div>
  );
}

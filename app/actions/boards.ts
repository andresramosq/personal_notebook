"use server";

import {
  createBoardLink,
  updateBoardLinkPosition,
  updateBoardName,
} from "@/lib/boards";

export async function createBoardLinkAction(
  parentBoardId: string,
  x: number,
  y: number,
) {
  return createBoardLink(parentBoardId, x, y);
}

export async function updateBoardNameAction(boardId: string, name: string) {
  return updateBoardName(boardId, name);
}

export async function updateBoardLinkPositionAction(
  linkId: string,
  parentBoardId: string,
  x: number,
  y: number,
) {
  await updateBoardLinkPosition(linkId, parentBoardId, x, y);
}

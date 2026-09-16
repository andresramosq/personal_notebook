"use server";

import {
  createBoard,
  deleteBoard,
  listBoards,
  listChildBoards,
  updateBoardName,
} from "@/lib/boards";

export async function listBoardsAction() {
  return listBoards();
}

export async function listChildBoardsAction(parentId: string) {
  return listChildBoards(parentId);
}

export async function createBoardAction(
  parentId?: string | null,
  x?: number,
  y?: number,
) {
  return createBoard({ parentId, x, y });
}

export async function updateBoardNameAction(id: string, name: string) {
  return updateBoardName(id, name);
}

export async function deleteBoardAction(id: string) {
  return deleteBoard(id);
}

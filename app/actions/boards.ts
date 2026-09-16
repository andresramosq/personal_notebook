"use server";

import {
  createBoard,
  deleteBoard,
  listBoards,
  listChildBoards,
  updateBoardName,
  updateBoardPosition,
} from "@/lib/boards";

export async function listBoardsAction() {
  return listBoards();
}

export async function listChildBoardsAction(parentId: string) {
  return listChildBoards(parentId);
}

export async function createBoardAction(options?: {
  parentId?: string | null;
  x?: number;
  y?: number;
}) {
  return createBoard(options ?? {});
}

export async function createRootBoardAction() {
  return createBoard({});
}

export async function updateBoardNameAction(id: string, name: string) {
  return updateBoardName(id, name);
}

export async function updateBoardPositionAction(
  id: string,
  x: number,
  y: number,
) {
  return updateBoardPosition(id, x, y);
}

export async function deleteBoardAction(id: string) {
  return deleteBoard(id);
}

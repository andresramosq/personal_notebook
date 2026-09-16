"use server";

import { createBoard, deleteBoard, listBoards, updateBoardName } from "@/lib/boards";

export async function listBoardsAction() {
  return listBoards();
}

export async function createBoardAction() {
  return createBoard();
}

export async function updateBoardNameAction(id: string, name: string) {
  return updateBoardName(id, name);
}

export async function deleteBoardAction(id: string) {
  return deleteBoard(id);
}

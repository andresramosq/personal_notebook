"use server";

import { createBoard, listBoards, updateBoardName } from "@/lib/boards";

export async function listBoardsAction() {
  return listBoards();
}

export async function createBoardAction() {
  return createBoard();
}

export async function updateBoardNameAction(id: string, name: string) {
  return updateBoardName(id, name);
}

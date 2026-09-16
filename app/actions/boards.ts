"use server";

import { createBoard, updateBoardName } from "@/lib/boards";

export async function createBoardAction() {
  return createBoard();
}

export async function updateBoardNameAction(id: string, name: string) {
  return updateBoardName(id, name);
}

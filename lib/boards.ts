import { prisma } from "@/lib/prisma";

export type BoardRecord = {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
};

export async function createBoard(name: string) {
  return prisma.board.create({
    data: { name },
  });
}

export async function getBoard(id: string) {
  return prisma.board.findUnique({
    where: { id },
  });
}

export async function listBoards() {
  return prisma.board.findMany({
    orderBy: { createdAt: "asc" },
  });
}

export async function updateBoardName(id: string, name: string) {
  return prisma.board.update({
    where: { id },
    data: { name },
  });
}

export async function deleteBoard(id: string) {
  return prisma.board.delete({
    where: { id },
  });
}

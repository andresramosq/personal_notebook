import { prisma } from "@/lib/prisma";

export type BoardRecord = {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
};

export async function listBoards(): Promise<BoardRecord[]> {
  return prisma.board.findMany({
    orderBy: { createdAt: "asc" },
  });
}

export async function createBoard(): Promise<BoardRecord> {
  const count = await prisma.board.count();

  return prisma.board.create({
    data: {
      name: `Pizarra ${count + 1}`,
    },
  });
}

export async function updateBoardName(
  id: string,
  name: string,
): Promise<BoardRecord> {
  const trimmed = name.trim();

  if (!trimmed) {
    throw new Error("El nombre no puede estar vacío.");
  }

  return prisma.board.update({
    where: { id },
    data: { name: trimmed },
  });
}

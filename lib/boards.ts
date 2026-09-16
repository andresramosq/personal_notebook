import { prisma } from "@/lib/prisma";

export type BoardRecord = {
  id: string;
  name: string;
  parentId: string | null;
  x: number;
  y: number;
  createdAt: Date;
};

const boardSelect = {
  id: true,
  name: true,
  parentId: true,
  x: true,
  y: true,
  createdAt: true,
} as const;

type CreateBoardOptions = {
  parentId?: string | null;
  x?: number;
  y?: number;
};

export async function listBoards(): Promise<BoardRecord[]> {
  return prisma.board.findMany({
    where: { parentId: null },
    orderBy: { createdAt: "asc" },
    select: boardSelect,
  });
}

export async function listChildBoards(parentId: string): Promise<BoardRecord[]> {
  return prisma.board.findMany({
    where: { parentId },
    orderBy: { createdAt: "asc" },
    select: boardSelect,
  });
}

export async function createBoard(
  options: CreateBoardOptions = {},
): Promise<BoardRecord> {
  const parentId = options.parentId ?? null;
  const count = await prisma.board.count({
    where: { parentId },
  });

  return prisma.board.create({
    data: {
      name: `Pizarra ${count + 1}`,
      parentId,
      x: options.x !== undefined ? options.x : 120 + count * 40,
      y: options.y !== undefined ? options.y : 120 + count * 40,
    },
    select: boardSelect,
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
    select: boardSelect,
  });
}

export async function updateBoardPosition(
  id: string,
  x: number,
  y: number,
): Promise<BoardRecord> {
  return prisma.board.update({
    where: { id },
    data: { x, y },
    select: boardSelect,
  });
}

export async function deleteBoard(id: string) {
  return prisma.board.delete({
    where: { id },
  });
}

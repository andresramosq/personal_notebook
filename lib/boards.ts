import { prisma } from "@/lib/prisma";

export type BoardLinkItem = {
  id: string;
  targetBoardId: string;
  x: number;
  y: number;
};

export async function getOrCreateRootBoard() {
  return prisma.board.upsert({
    where: { slug: "principal" },
    update: {},
    create: {
      slug: "principal",
      name: "Pizarra principal",
    },
  });
}

export async function getBoardWithLinks(boardId: string) {
  return prisma.board.findUnique({
    where: { id: boardId },
    include: {
      links: {
        select: {
          id: true,
          targetBoardId: true,
          x: true,
          y: true,
        },
      },
    },
  });
}

export async function createBoardLink(
  parentBoardId: string,
  x: number,
  y: number,
) {
  return prisma.$transaction(async (tx) => {
    const targetBoard = await tx.board.create({
      data: {
        name: "Pizarra",
      },
    });

    const link = await tx.boardLink.create({
      data: {
        parentBoardId,
        targetBoardId: targetBoard.id,
        x,
        y,
      },
      select: {
        id: true,
        targetBoardId: true,
        x: true,
        y: true,
      },
    });

    return link;
  });
}

export async function updateBoardLinkPosition(
  linkId: string,
  parentBoardId: string,
  x: number,
  y: number,
) {
  return prisma.boardLink.updateMany({
    where: {
      id: linkId,
      parentBoardId,
    },
    data: { x, y },
  });
}

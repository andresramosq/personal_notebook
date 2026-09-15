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

export async function getParentBoard(boardId: string) {
  const link = await prisma.boardLink.findFirst({
    where: { targetBoardId: boardId },
    select: {
      parentBoard: {
        select: {
          id: true,
          slug: true,
        },
      },
    },
  });

  return link?.parentBoard ?? null;
}

export function getBackHref(
  parentBoard: { id: string; slug: string | null } | null,
) {
  if (!parentBoard) {
    return null;
  }

  if (parentBoard.slug === "principal") {
    return "/";
  }

  return `/pizarra/${parentBoard.id}`;
}

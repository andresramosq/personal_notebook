import { prisma } from "@/lib/prisma";

export type BoardLinkItem = {
  id: string;
  targetBoardId: string;
  name: string;
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
          targetBoard: {
            select: {
              name: true,
            },
          },
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
    const name = `Pizarra ${(await tx.board.count()) + 1}`;

    const targetBoard = await tx.board.create({
      data: { name },
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

    return {
      ...link,
      name: targetBoard.name,
    };
  });
}

export async function updateBoardName(boardId: string, name: string) {
  return prisma.board.update({
    where: { id: boardId },
    data: { name },
    select: { id: true, name: true },
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

type BoardLinkRecord = {
  id: string;
  targetBoardId: string;
  x: number;
  y: number;
  targetBoard: {
    name: string;
  };
};

export function formatBoardLinks(links: BoardLinkRecord[]): BoardLinkItem[] {
  return links.map((link) => ({
    id: link.id,
    targetBoardId: link.targetBoardId,
    name: link.targetBoard.name,
    x: link.x,
    y: link.y,
  }));
}

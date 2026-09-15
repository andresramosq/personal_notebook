import { NextResponse } from "next/server";
import {
  createBoardLink,
  formatBoardLinks,
  getBoardWithLinks,
  updateBoardName,
} from "@/lib/boards";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const board = await getBoardWithLinks(id);

  if (!board) {
    return NextResponse.json(
      { error: "Pizarra no encontrada" },
      { status: 404 },
    );
  }

  return NextResponse.json({
    id: board.id,
    name: board.name,
    links: formatBoardLinks(board.links),
  });
}

export async function POST(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const body = (await request.json()) as { x?: number; y?: number };

  if (typeof body.x !== "number" || typeof body.y !== "number") {
    return NextResponse.json(
      { error: "Coordenadas inválidas" },
      { status: 400 },
    );
  }

  const parentBoard = await getBoardWithLinks(id);

  if (!parentBoard) {
    return NextResponse.json(
      { error: "Pizarra no encontrada" },
      { status: 404 },
    );
  }

  const link = await createBoardLink(id, body.x, body.y);

  return NextResponse.json({ link }, { status: 201 });
}

export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const body = (await request.json()) as { name?: string };
  const name = body.name?.trim();

  if (!name) {
    return NextResponse.json({ error: "Nombre inválido" }, { status: 400 });
  }

  const board = await getBoardWithLinks(id);

  if (!board) {
    return NextResponse.json(
      { error: "Pizarra no encontrada" },
      { status: 404 },
    );
  }

  const updated = await updateBoardName(id, name);

  return NextResponse.json({ id: updated.id, name: updated.name });
}

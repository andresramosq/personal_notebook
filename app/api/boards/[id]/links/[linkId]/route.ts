import { NextResponse } from "next/server";
import { updateBoardLinkPosition } from "@/lib/boards";

type RouteContext = {
  params: Promise<{ id: string; linkId: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  const { id, linkId } = await context.params;
  const body = (await request.json()) as { x?: number; y?: number };

  if (typeof body.x !== "number" || typeof body.y !== "number") {
    return NextResponse.json(
      { error: "Coordenadas inválidas" },
      { status: 400 },
    );
  }

  const result = await updateBoardLinkPosition(linkId, id, body.x, body.y);

  if (result.count === 0) {
    return NextResponse.json({ error: "Enlace no encontrado" }, { status: 404 });
  }

  return NextResponse.json({
    link: {
      id: linkId,
      x: body.x,
      y: body.y,
    },
  });
}

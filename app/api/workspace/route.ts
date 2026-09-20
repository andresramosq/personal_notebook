import { NextResponse } from "next/server";
import { readWorkspace, writeWorkspace } from "@/lib/workspace/database";
import type { WorkspaceState } from "@/lib/workspace/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET() {
  try {
    return NextResponse.json(readWorkspace());
  } catch (error) {
    console.error("Unable to read workspace", error);
    return NextResponse.json(
      { error: "No se pudo leer la base de datos." },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request) {
  try {
    const state = (await request.json()) as WorkspaceState;

    if (
      state.version !== 3 ||
      !Array.isArray(state.canvases) ||
      !Array.isArray(state.items) ||
      !Array.isArray(state.links) ||
      !state.activeCanvasId
    ) {
      return NextResponse.json(
        { error: "Los datos del espacio no son válidos." },
        { status: 400 },
      );
    }

    writeWorkspace(state);
    return NextResponse.json({ saved: true });
  } catch (error) {
    console.error("Unable to save workspace", error);
    return NextResponse.json(
      { error: "No se pudo guardar en la base de datos." },
      { status: 500 },
    );
  }
}

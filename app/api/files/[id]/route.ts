import fs from "node:fs";
import path from "node:path";
import { NextRequest, NextResponse } from "next/server";

const uploadsDir =
  process.env.LIBRETA_UPLOADS_PATH ??
  path.join(process.cwd(), "data", "uploads");

const MIME_BY_EXT: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".mov": "video/quicktime",
  ".pdf": "application/pdf",
  ".zip": "application/zip",
  ".txt": "text/plain",
  ".md": "text/markdown",
};

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  if (!/^[a-zA-Z0-9_-]+$/.test(id)) {
    return NextResponse.json({ error: "Archivo no encontrado" }, { status: 404 });
  }

  const match = fs
    .readdirSync(uploadsDir)
    .find((name) => name.startsWith(`${id}.`) || name === id);

  if (!match) {
    return NextResponse.json({ error: "Archivo no encontrado" }, { status: 404 });
  }

  const filePath = path.join(uploadsDir, match);
  const ext = path.extname(match).toLowerCase();
  const data = fs.readFileSync(filePath);

  return new NextResponse(data, {
    headers: {
      "Content-Type": MIME_BY_EXT[ext] ?? "application/octet-stream",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}

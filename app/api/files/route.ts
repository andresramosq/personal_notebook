import fs from "node:fs";
import path from "node:path";
import { NextRequest, NextResponse } from "next/server";
import { createId } from "@/lib/workspace/id";
import {
  classifyUpload,
  maxBytesForKind,
  type UploadKind,
} from "@/lib/workspace/upload-policy";

const uploadsDir =
  process.env.LIBRETA_UPLOADS_PATH ??
  path.join(process.cwd(), "data", "uploads");

fs.mkdirSync(uploadsDir, { recursive: true });

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

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Archivo requerido" }, { status: 400 });
    }

    const kind = classifyUpload(file.type, file.name);
    if (!kind) {
      return NextResponse.json(
        {
          error:
            "Formato no soportado. Usa JPG, PNG, GIF, WebP, SVG, MP4, WebM, MOV, PDF, ZIP o TXT.",
        },
        { status: 400 },
      );
    }

    if (file.size > maxBytesForKind(kind)) {
      const limitMb = Math.round(maxBytesForKind(kind) / (1024 * 1024));
      return NextResponse.json(
        { error: `El archivo supera el límite de ${limitMb} MB.` },
        { status: 400 },
      );
    }

    const id = createId();
    const ext = path.extname(file.name).toLowerCase() || defaultExt(kind);
    const storedName = `${id}${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    fs.writeFileSync(path.join(uploadsDir, storedName), buffer);

    return NextResponse.json({
      id,
      url: `/api/files/${id}`,
      kind,
      name: file.name,
      mimeType: file.type || MIME_BY_EXT[ext] || "application/octet-stream",
      size: file.size,
    });
  } catch {
    return NextResponse.json({ error: "No se pudo subir el archivo" }, { status: 500 });
  }
}

function defaultExt(kind: UploadKind) {
  if (kind === "image") return ".png";
  if (kind === "video") return ".mp4";
  return ".bin";
}

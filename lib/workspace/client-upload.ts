import type { ItemKind } from "@/lib/workspace/types";
import type { UploadKind } from "@/lib/workspace/upload-policy";

export type UploadedAsset = {
  url: string;
  kind: UploadKind;
  name: string;
  mimeType: string;
  size: number;
};

export async function uploadBoardFile(file: File): Promise<UploadedAsset> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch("/api/files", {
    method: "POST",
    body: formData,
  });

  const payload = (await response.json()) as UploadedAsset & { error?: string };
  if (!response.ok) {
    throw new Error(payload.error ?? "No se pudo subir el archivo");
  }

  return payload;
}

export function itemKindForUpload(kind: UploadKind): ItemKind {
  if (kind === "image") return "image";
  if (kind === "video") return "video";
  return "file";
}

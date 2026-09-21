export const UPLOAD_SIZE_LIMITS = {
  image: 10 * 1024 * 1024,
  video: 50 * 1024 * 1024,
  file: 50 * 1024 * 1024,
} as const;

const IMAGE_MIMES = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/svg+xml",
]);

const VIDEO_MIMES = new Set([
  "video/mp4",
  "video/webm",
  "video/quicktime",
]);

const FILE_MIMES = new Set([
  "application/pdf",
  "application/zip",
  "application/x-zip-compressed",
  "text/plain",
  "text/markdown",
]);

export type UploadKind = "image" | "video" | "file";

export function classifyUpload(
  mimeType: string,
  fileName: string,
): UploadKind | null {
  const mime = mimeType.toLowerCase();
  if (IMAGE_MIMES.has(mime)) return "image";
  if (VIDEO_MIMES.has(mime)) return "video";
  if (FILE_MIMES.has(mime)) return "file";

  const ext = fileName.split(".").pop()?.toLowerCase();
  if (ext && ["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext)) {
    return "image";
  }
  if (ext && ["mp4", "webm", "mov"].includes(ext)) return "video";
  if (ext && ["pdf", "zip", "txt", "md"].includes(ext)) return "file";

  return null;
}

export function maxBytesForKind(kind: UploadKind) {
  return UPLOAD_SIZE_LIMITS[kind];
}

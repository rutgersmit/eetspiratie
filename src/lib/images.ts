import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { getImageDir } from "./db";

export const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB

export const IMAGE_CONTENT_TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  png: "image/png",
  gif: "image/gif",
  webp: "image/webp",
};

// Random UUID + known extension; nothing user-controlled ends up in a path.
const IMAGE_NAME = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|png|gif|webp)$/;

export function isValidImageName(name: string): boolean {
  return IMAGE_NAME.test(name);
}

/** Detects the image type from its magic bytes; the client's MIME type is not trusted. */
export function detectImageType(buf: Uint8Array): string | null {
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "jpg";
  if (buf.length >= 8 && buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return "png";
  if (buf.length >= 6 && String.fromCharCode(...buf.subarray(0, 4)) === "GIF8") return "gif";
  if (
    buf.length >= 12 &&
    String.fromCharCode(...buf.subarray(0, 4)) === "RIFF" &&
    String.fromCharCode(...buf.subarray(8, 12)) === "WEBP"
  )
    return "webp";
  return null;
}

export async function saveImage(file: File): Promise<string> {
  if (file.size > MAX_IMAGE_SIZE) throw new Error("Afbeelding mag maximaal 10MB zijn");
  const buf = new Uint8Array(await file.arrayBuffer());
  const ext = detectImageType(buf);
  if (!ext) throw new Error("Alleen JPG, PNG, GIF en WebP zijn toegestaan");

  const name = `${randomUUID()}.${ext}`;
  await fs.writeFile(path.join(getImageDir(), name), buf, { flag: "wx" });
  return name;
}

export async function deleteImage(name: string | null) {
  if (!name || !isValidImageName(name)) return;
  await fs.rm(path.join(getImageDir(), name), { force: true });
}

export async function readImage(name: string): Promise<Buffer | null> {
  if (!isValidImageName(name)) return null;
  try {
    return await fs.readFile(path.join(getImageDir(), name));
  } catch {
    return null;
  }
}

import { writeFile } from "fs/promises";
import path from "path";

const ALLOWED_EXTS = new Set(["jpg", "jpeg", "png", "webp", "mp4"]);
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export async function saveUploadedFile(file: File): Promise<string> {
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`File "${file.name}" vượt quá giới hạn 10MB`);
  }

  const ext = (file.name.split(".").pop() ?? "bin").toLowerCase();
  if (!ALLOWED_EXTS.has(ext)) {
    throw new Error(`Định dạng file "${ext}" không được hỗ trợ`);
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const filename = `${crypto.randomUUID()}.${ext}`;
  const filepath = path.join(process.cwd(), "public", "uploads", filename);
  await writeFile(filepath, buffer);
  return `/uploads/${filename}`;
}

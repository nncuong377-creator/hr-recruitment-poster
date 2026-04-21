import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import path from "path";
import fs from "fs/promises";
import { prisma } from "@/lib/prisma";

function cuid(): string {
  return Math.random().toString(36).slice(2, 11) + Date.now().toString(36);
}

const Schema = z.object({ contentId: z.string().min(1) });

export async function POST(req: NextRequest) {
  let body: unknown;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Request không hợp lệ" }, { status: 400 }); }

  const parsed = Schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "contentId là bắt buộc" }, { status: 400 });
  }

  const { contentId } = parsed.data;

  try {
    const content = await prisma.content.findUnique({
      where: { id: contentId },
      include: { medias: { orderBy: { createdAt: "asc" } } },
    });
    if (!content) {
      return NextResponse.json({ error: "Content không tồn tại" }, { status: 404 });
    }

    if (content.medias.length === 0) {
      return NextResponse.json({ sessionId: null, absolutePath: null, mediaCount: 0, files: [] });
    }

    const sessionId = cuid();
    const sessionsRoot = path.join(process.cwd(), "public", "posting-sessions");
    const sessionDir = path.join(sessionsRoot, sessionId);

    await fs.mkdir(sessionsRoot, { recursive: true });
    await fs.mkdir(sessionDir, { recursive: true });

    const files: { order: number; name: string; originalName: string }[] = [];

    for (let i = 0; i < content.medias.length; i++) {
      const media = content.medias[i];
      const ext = path.extname(media.originalName || media.url) || ".jpg";
      const baseName = path.basename(media.originalName || media.url, ext);
      const destName = `${String(i + 1).padStart(2, "0")}_${baseName}${ext}`;
      const srcPath = path.join(process.cwd(), "public", media.url);
      const destPath = path.join(sessionDir, destName);

      try {
        await fs.copyFile(srcPath, destPath);
        files.push({ order: i + 1, name: destName, originalName: media.originalName });
      } catch {
        // Bỏ qua nếu file không tồn tại
      }
    }

    return NextResponse.json({
      sessionId,
      absolutePath: sessionDir,
      mediaCount: files.length,
      files,
    });
  } catch (err) {
    console.error("[POST /api/posting-session]", err);
    return NextResponse.json({ error: "Tạo session thất bại" }, { status: 500 });
  }
}

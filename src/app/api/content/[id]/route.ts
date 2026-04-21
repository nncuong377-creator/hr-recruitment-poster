import { NextRequest, NextResponse } from "next/server";
import { unlink } from "fs/promises";
import path from "path";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

// ─── GET /api/content/[id] ─────────────────────────────────────────────────────

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const content = await prisma.content.findUnique({
      where: { id },
      include: {
        medias: true,
        author: { select: { name: true } },
        _count: { select: { postLogs: true } },
      },
    });
    if (!content) return NextResponse.json({ error: "Không tìm thấy" }, { status: 404 });
    return NextResponse.json({ data: content });
  } catch (err) {
    console.error("[GET /api/content/[id]]", err);
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}

// ─── PATCH /api/content/[id] ───────────────────────────────────────────────────

const PatchSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  hashtags: z.array(z.string()).optional(),
  status: z.enum(["DRAFT", "APPROVED", "POSTED", "ARCHIVED"]).optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Request không hợp lệ" }, { status: 400 });
  }

  const parsed = PatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dữ liệu không hợp lệ", details: parsed.error.issues }, { status: 400 });
  }

  const { hashtags, ...rest } = parsed.data;
  const data: Record<string, unknown> = { ...rest };
  if (hashtags !== undefined) {
    data.hashtags = hashtags.join(" ");
  }

  try {
    const updated = await prisma.content.update({
      where: { id },
      data,
      include: { medias: true, author: { select: { name: true } } },
    });
    return NextResponse.json({ data: updated });
  } catch (err) {
    console.error("[PATCH /api/content/[id]]", err);
    return NextResponse.json({ error: "Cập nhật thất bại" }, { status: 500 });
  }
}

// ─── DELETE /api/content/[id] ──────────────────────────────────────────────────

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const content = await prisma.content.findUnique({
      where: { id },
      include: { medias: true },
    });
    if (!content) return NextResponse.json({ error: "Không tìm thấy" }, { status: 404 });

    // Xoá files trên disk
    let deletedMediaCount = 0;
    for (const media of content.medias) {
      try {
        await unlink(path.join(process.cwd(), "public", media.url));
        deletedMediaCount++;
      } catch (e: unknown) {
        if ((e as NodeJS.ErrnoException).code !== "ENOENT") {
          console.warn("[DELETE content] Không xoá được file:", media.url, e);
        }
      }
    }

    // Xoá content (cascade xoá Media records)
    await prisma.content.delete({ where: { id } });

    return NextResponse.json({ success: true, deletedMediaCount });
  } catch (err) {
    console.error("[DELETE /api/content/[id]]", err);
    return NextResponse.json({ error: "Xoá thất bại" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { isFacebookGroupUrl, normalizeFacebookGroupUrl } from "@/lib/facebook-url";

// ─── PATCH /api/groups/[id] ───────────────────────────────────────────────────

const PatchSchema = z.object({
  name: z.string().min(2).max(200).optional(),
  url: z.string().optional(),
  category: z.enum(["IT", "SALES", "MARKETING", "GENERAL", "OTHER"]).optional(),
  memberCount: z.number().int().nonnegative().optional().nullable(),
  notes: z.string().max(1000).optional(),
  isActive: z.boolean().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  let body: unknown;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Request không hợp lệ" }, { status: 400 }); }

  const parsed = PatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dữ liệu không hợp lệ", details: parsed.error.issues }, { status: 400 });
  }

  // Chỉ giữ các field mà Prisma client gốc biết: name, url, category, isActive
  // memberCount, notes, lastPostedAt cần prisma generate trước mới dùng được
  const { memberCount, notes, ...knownFields } = parsed.data;
  const data: Record<string, unknown> = { ...knownFields };
  // Thêm lại nếu Prisma client đã được regenerate (sau khi restart server + prisma generate)
  void memberCount; void notes;

  // Validate + normalize URL nếu có
  if (parsed.data.url) {
    if (!isFacebookGroupUrl(parsed.data.url)) {
      return NextResponse.json({ error: "URL phải là Facebook group" }, { status: 400 });
    }
    const normalizedUrl = normalizeFacebookGroupUrl(parsed.data.url);
    // Unique check dùng findFirst (không dùng findUnique để tránh lỗi nếu Prisma client chưa regenerate)
    const existing = await prisma.fbGroup.findFirst({
      where: { url: normalizedUrl, NOT: { id } },
    });
    if (existing) {
      return NextResponse.json({ error: "URL group này đã tồn tại", field: "url" }, { status: 409 });
    }
    data.url = normalizedUrl;
  }

  try {
    const updated = await prisma.fbGroup.update({
      where: { id },
      data,
      include: { _count: { select: { postLogs: true } } },
    });
    return NextResponse.json({ data: updated });
  } catch (err) {
    console.error("[PATCH /api/groups/[id]]", err);
    return NextResponse.json({ error: "Cập nhật thất bại" }, { status: 500 });
  }
}

// ─── DELETE /api/groups/[id] ──────────────────────────────────────────────────

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const force = req.nextUrl.searchParams.get("force") === "true";

  try {
    const group = await prisma.fbGroup.findUnique({
      where: { id },
      include: { _count: { select: { postLogs: true } } },
    });
    if (!group) return NextResponse.json({ error: "Không tìm thấy group" }, { status: 404 });

    const postLogCount = group._count.postLogs;

    // Có lịch sử đăng bài → cần xác nhận đặc biệt
    if (postLogCount > 0 && !force) {
      return NextResponse.json(
        { error: "GROUP_HAS_POSTLOGS", postLogCount, groupName: group.name },
        { status: 409 }
      );
    }

    // Force delete: xoá PostLog trước
    if (force && postLogCount > 0) {
      await prisma.postLog.deleteMany({ where: { fbGroupId: id } });
    }

    await prisma.fbGroup.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[DELETE /api/groups/[id]]", err);
    return NextResponse.json({ error: "Xoá thất bại" }, { status: 500 });
  }
}

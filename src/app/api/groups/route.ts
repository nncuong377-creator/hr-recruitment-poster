import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { isFacebookGroupUrl, normalizeFacebookGroupUrl } from "@/lib/facebook-url";
import type { Prisma } from "@prisma/client";

// ─── GET /api/groups ───────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const search = searchParams.get("search")?.trim() ?? "";
  const category = searchParams.get("category") ?? "";
  const status = searchParams.get("status") ?? ""; // "active" | "inactive" | ""
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const limit = Math.max(1, Math.min(100, parseInt(searchParams.get("limit") ?? "20", 10)));

  const where: Prisma.FbGroupWhereInput = {};
  if (search) {
    where.OR = [
      { name: { contains: search } },
      { url: { contains: search } },
    ];
  }
  if (category && ["IT", "SALES", "MARKETING", "GENERAL", "OTHER"].includes(category)) {
    where.category = category as "IT" | "SALES" | "MARKETING" | "GENERAL" | "OTHER";
  }
  if (status === "active") where.isActive = true;
  if (status === "inactive") where.isActive = false;

  try {
    const [total, active, inactive, items] = await Promise.all([
      prisma.fbGroup.count(),
      prisma.fbGroup.count({ where: { isActive: true } }),
      prisma.fbGroup.count({ where: { isActive: false } }),
      prisma.fbGroup.findMany({
        where,
        orderBy: [{ isActive: "desc" }, { name: "asc" }],
        skip: (page - 1) * limit,
        take: limit,
        include: { _count: { select: { postLogs: true } } },
      }),
    ]);

    return NextResponse.json({
      items,
      total: await prisma.fbGroup.count({ where }),
      page,
      totalPages: Math.max(1, Math.ceil((await prisma.fbGroup.count({ where })) / limit)),
      stats: { total, active, inactive },
    });
  } catch (err) {
    console.error("[GET /api/groups]", err);
    return NextResponse.json({ error: "Lấy danh sách thất bại" }, { status: 500 });
  }
}

// ─── POST /api/groups ──────────────────────────────────────────────────────────

const CreateSchema = z.object({
  name: z.string().min(2, "Tên tối thiểu 2 ký tự").max(200),
  url: z.string().min(1, "URL là bắt buộc"),
  category: z.enum(["IT", "SALES", "MARKETING", "GENERAL", "OTHER"]),
  memberCount: z.number().int().nonnegative().optional().nullable(),
  notes: z.string().max(1000).optional(),
  isActive: z.boolean().optional(),
});

export async function POST(req: NextRequest) {
  let body: unknown;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Request không hợp lệ" }, { status: 400 }); }

  const parsed = CreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dữ liệu không hợp lệ", details: parsed.error.issues }, { status: 400 });
  }

  const { url: rawUrl, ...rest } = parsed.data;

  // Validate FB URL
  if (!isFacebookGroupUrl(rawUrl)) {
    return NextResponse.json({ error: "URL phải là Facebook group (https://facebook.com/groups/...)" }, { status: 400 });
  }
  const url = normalizeFacebookGroupUrl(rawUrl);

  try {
    // Unique check dùng findFirst để tránh lỗi nếu Prisma client chưa regenerate
    const existing = await prisma.fbGroup.findFirst({ where: { url } });
    if (existing) {
      return NextResponse.json({ error: "URL group này đã tồn tại trong hệ thống", field: "url" }, { status: 409 });
    }

    const group = await prisma.fbGroup.create({
      data: {
        name: rest.name,
        url,
        category: rest.category,
        isActive: rest.isActive ?? true,
      },
    });
    return NextResponse.json({ data: group });
  } catch (err) {
    console.error("[POST /api/groups]", err);
    return NextResponse.json({ error: "Tạo group thất bại", detail: String(err) }, { status: 500 });
  }
}

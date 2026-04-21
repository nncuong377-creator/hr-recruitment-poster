import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";
import { saveUploadedFile } from "@/lib/upload";
import type { MediaType, Prisma } from "@prisma/client";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const search = searchParams.get("search")?.trim() ?? "";
  const status = searchParams.get("status") ?? "";
  const sort = searchParams.get("sort") ?? "newest";
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const limit = Math.max(1, Math.min(50, parseInt(searchParams.get("limit") ?? "12", 10)));

  const where: Prisma.ContentWhereInput = {};
  if (search) {
    where.OR = [
      { title: { contains: search } },
      { position: { contains: search } },
    ];
  }
  if (status && ["DRAFT", "APPROVED", "POSTED", "ARCHIVED"].includes(status)) {
    where.status = status as "DRAFT" | "APPROVED" | "POSTED" | "ARCHIVED";
  }

  const orderBy: Prisma.ContentOrderByWithRelationInput =
    sort === "oldest" ? { createdAt: "asc" }
    : sort === "alphabetical" ? { title: "asc" }
    : { createdAt: "desc" };

  try {
    const [total, items] = await Promise.all([
      prisma.content.count({ where }),
      prisma.content.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          medias: { select: { id: true, url: true, type: true } },
          author: { select: { name: true } },
          _count: { select: { postLogs: true } },
        },
      }),
    ]);

    return NextResponse.json({
      items,
      total,
      page,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[GET /api/content]", message);
    return NextResponse.json({ error: "Lấy danh sách thất bại" }, { status: 500 });
  }
}

const IMAGE_EXTS = new Set(["jpg", "jpeg", "png", "webp"]);
const MAX_TOTAL_SIZE = 50 * 1024 * 1024; // 50MB

export async function POST(req: NextRequest) {
  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Request không hợp lệ" }, { status: 400 });
  }

  const title = (formData.get("title") as string | null)?.trim() ?? "";
  const position = (formData.get("position") as string | null)?.trim() ?? "";
  const description = (formData.get("description") as string | null)?.trim() ?? "";
  const requirements = (formData.get("requirements") as string | null)?.trim() ?? "";
  const benefits = (formData.get("benefits") as string | null)?.trim() ?? "";
  const applyInfo = (formData.get("applyInfo") as string | null)?.trim() ?? "";
  const hashtagsRaw = (formData.get("hashtags") as string | null) ?? "[]";
  const status = (formData.get("status") as string | null) ?? "DRAFT";

  // Validate required fields
  if (title.length < 2) {
    return NextResponse.json({ error: "Tiêu đề tối thiểu 2 ký tự" }, { status: 400 });
  }
  if (!position) {
    return NextResponse.json({ error: "Vị trí tuyển dụng là bắt buộc" }, { status: 400 });
  }
  if (!description) {
    return NextResponse.json({ error: "Nội dung bài đăng là bắt buộc" }, { status: 400 });
  }
  if (status !== "DRAFT" && status !== "APPROVED") {
    return NextResponse.json({ error: "Status không hợp lệ" }, { status: 400 });
  }

  // Parse hashtags
  let hashtags: string[] = [];
  try {
    hashtags = JSON.parse(hashtagsRaw);
  } catch {
    hashtags = [];
  }

  // Get media files
  const mediaFileEntries = formData.getAll("media") as File[];
  const validMediaFiles = mediaFileEntries.filter((f) => f instanceof File && f.size > 0);

  // Validate total size
  const totalSize = validMediaFiles.reduce((sum, f) => sum + f.size, 0);
  if (totalSize > MAX_TOTAL_SIZE) {
    return NextResponse.json({ error: "Tổng dung lượng file vượt quá 50MB" }, { status: 400 });
  }

  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const authorId = session.user.id;

    // Upload files trước
    const uploadedMedia: Array<{ url: string; type: MediaType; originalName: string }> = [];
    for (const file of validMediaFiles) {
      const url = await saveUploadedFile(file);
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
      const type: MediaType = IMAGE_EXTS.has(ext) ? "IMAGE" : "VIDEO";
      uploadedMedia.push({ url, type, originalName: file.name });
    }

    // Tạo Content record
    const content = await prisma.content.create({
      data: {
        title,
        position,
        description,
        requirements,
        benefits,
        applyInfo,
        hashtags: hashtags.join(" "),
        status: status as "DRAFT" | "APPROVED",
        authorId,
        medias: {
          create: uploadedMedia,
        },
      },
      include: { medias: true },
    });

    return NextResponse.json({ data: { id: content.id, title: content.title, status: content.status } });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[/api/content] Lỗi lưu:", message);
    return NextResponse.json({ error: "Lưu thất bại", detail: message }, { status: 500 });
  }
}

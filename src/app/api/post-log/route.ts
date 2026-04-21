import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";

// ─── GET /api/post-log ────────────────────────────────────────────────────────
// Query: ?contentId=xxx → { fbGroupIds: string[] } (groups đã đăng content này)

export async function GET(req: NextRequest) {
  const contentId = req.nextUrl.searchParams.get("contentId");
  if (!contentId) {
    return NextResponse.json({ fbGroupIds: [] });
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const logs = await (prisma.postLog as any).findMany({
      where: { contentId, status: "SUCCESS" },
      select: { fbGroupId: true },
    });
    const fbGroupIds = [...new Set((logs as { fbGroupId: string }[]).map((l) => l.fbGroupId))];
    return NextResponse.json({ fbGroupIds });
  } catch (err) {
    console.error("[GET /api/post-log]", err);
    return NextResponse.json({ fbGroupIds: [] });
  }
}

// ─── POST /api/post-log ───────────────────────────────────────────────────────

const Schema = z.object({
  contentId: z.string().min(1),
  fbGroupId: z.string().min(1),
  status: z.enum(["SUCCESS", "FAILED", "SKIPPED"]),
  errorMsg: z.string().max(500).optional(),
  postUrl: z.string().url().optional().or(z.literal("")),
});

export async function POST(req: NextRequest) {
  let body: unknown;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Request không hợp lệ" }, { status: 400 }); }

  const parsed = Schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dữ liệu không hợp lệ", details: parsed.error.issues }, { status: 400 });
  }

  const { contentId, fbGroupId, status, errorMsg, postUrl } = parsed.data;

  try {
    const session = await getServerSession(authOptions);
    const postedById = session?.user?.id ?? null;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const postLog = await (prisma.postLog as any).create({
      data: {
        contentId,
        fbGroupId,
        postedById,
        status,
        errorMsg: errorMsg || null,
        postUrl: postUrl || null,
      },
    });

    // Cập nhật lastPostedAt khi đăng thành công
    if (status === "SUCCESS") {
      await prisma.fbGroup.update({
        where: { id: fbGroupId },
        data: { lastPostedAt: new Date() },
      });
    }

    return NextResponse.json({ data: postLog });
  } catch (err) {
    console.error("[POST /api/post-log]", err);
    return NextResponse.json({ error: "Tạo log thất bại" }, { status: 500 });
  }
}

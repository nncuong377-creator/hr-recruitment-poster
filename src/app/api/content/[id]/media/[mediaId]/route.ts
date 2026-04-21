import { NextRequest, NextResponse } from "next/server";
import { unlink } from "fs/promises";
import path from "path";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; mediaId: string }> }
) {
  const { mediaId } = await params;
  try {
    const media = await prisma.media.findUnique({ where: { id: mediaId } });
    if (!media) return NextResponse.json({ error: "Không tìm thấy media" }, { status: 404 });

    // Xoá file trên disk
    try {
      await unlink(path.join(process.cwd(), "public", media.url));
    } catch (e: unknown) {
      if ((e as NodeJS.ErrnoException).code !== "ENOENT") {
        console.warn("[DELETE media] Không xoá được file:", media.url);
      }
    }

    await prisma.media.delete({ where: { id: mediaId } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[DELETE /api/content/[id]/media/[mediaId]]", err);
    return NextResponse.json({ error: "Xoá media thất bại" }, { status: 500 });
  }
}

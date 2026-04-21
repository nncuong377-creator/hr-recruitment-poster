import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs/promises";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await params;

  // Validate: chỉ cho phép alphanumeric để tránh path traversal
  if (!/^[a-z0-9]+$/i.test(sessionId)) {
    return NextResponse.json({ error: "sessionId không hợp lệ" }, { status: 400 });
  }

  try {
    const sessionDir = path.join(process.cwd(), "public", "posting-sessions", sessionId);
    await fs.rm(sessionDir, { recursive: true, force: true });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[DELETE /api/posting-session]", err);
    return NextResponse.json({ error: "Xoá session thất bại" }, { status: 500 });
  }
}

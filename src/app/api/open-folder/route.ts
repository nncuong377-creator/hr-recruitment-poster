import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import path from "path";
import { spawn } from "child_process";

const Schema = z.object({ path: z.string().min(1) });

export async function POST(req: NextRequest) {
  let body: unknown;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Request không hợp lệ" }, { status: 400 }); }

  const parsed = Schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "path là bắt buộc" }, { status: 400 });
  }

  const folderPath = parsed.data.path;
  const allowedRoot = path.join(process.cwd(), "public", "posting-sessions");

  // Security: chỉ cho phép mở folder bên trong posting-sessions/
  if (!folderPath.startsWith(allowedRoot)) {
    return NextResponse.json({ error: "Không được phép mở folder này" }, { status: 403 });
  }

  try {
    const platform = process.platform;
    if (platform === "win32") {
      spawn("explorer", [folderPath], { detached: true, stdio: "ignore" });
    } else if (platform === "darwin") {
      spawn("open", [folderPath], { detached: true, stdio: "ignore" });
    } else {
      spawn("xdg-open", [folderPath], { detached: true, stdio: "ignore" });
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[POST /api/open-folder]", err);
    return NextResponse.json({ error: "Không thể mở folder" }, { status: 500 });
  }
}

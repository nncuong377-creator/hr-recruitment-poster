import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { generateRecruitmentContent } from "@/lib/qwen";

const GenerateSchema = z.object({
  jobTitle: z.string().min(2, "Tên vị trí tối thiểu 2 ký tự").max(100),
  category: z.enum(["IT", "SALES", "MARKETING", "GENERAL", "OTHER"]),
  requirements: z.string().max(1000).optional(),
  benefits: z.string().max(1000).optional(),
  tone: z.enum(["professional", "friendly", "energetic"]).optional(),
  contactInfo: z.string().max(500).optional(),
});

export async function POST(req: NextRequest) {
  // Parse request body
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Request body không hợp lệ (phải là JSON)" },
      { status: 400 }
    );
  }

  // Validate input
  const parsed = GenerateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Validation failed",
        details: parsed.error.issues.map((e) => ({
          field: e.path.map(String).join("."),
          message: e.message,
        })),
      },
      { status: 400 }
    );
  }

  // Gọi Qwen generate
  try {
    const result = await generateRecruitmentContent(parsed.data);
    return NextResponse.json({ data: result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[/api/generate] Lỗi Qwen:", message);
    return NextResponse.json(
      { error: "AI generation failed", detail: message },
      { status: 500 }
    );
  }
}

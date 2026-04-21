import { config } from "dotenv";
// Load cả .env và .env.local (Next.js tự xử lý .env.local, script tsx phải load thủ công)
config({ path: ".env" });
config({ path: ".env.local", override: true });

import { generateRecruitmentContent } from "../src/lib/qwen";

async function runTest(label: string, input: Parameters<typeof generateRecruitmentContent>[0]) {
  console.log(`\n${"─".repeat(60)}`);
  console.log(`🧪 Test: ${label}`);
  console.log(`${"─".repeat(60)}`);
  console.log("Input:", JSON.stringify(input, null, 2));

  try {
    const result = await generateRecruitmentContent(input);
    console.log("\n✅ Kết quả:\n");
    console.log("📝 suggestedTitle:", result.suggestedTitle);
    console.log("\n🏷️  hashtags:", result.hashtags.join(" "));
    if (result.missingFields.length > 0) {
      console.log("\n⚠️  missingFields:", result.missingFields.join(", "));
    } else {
      console.log("\n✅ missingFields: (none)");
    }
    if (result.warnings.length > 0) {
      console.log("⚠️  warnings:");
      result.warnings.forEach((w) => console.log("   -", w));
    }
    console.log("\n📄 body:\n");
    console.log(result.body);
  } catch (err) {
    console.error("❌ Lỗi:", err instanceof Error ? err.message : err);
  }
}

async function main() {
  console.log("🚀 Test Qwen DashScope — generateRecruitmentContent\n");

  // Test 1: IT position, professional
  await runTest("Backend Developer — IT, professional", {
    jobTitle: "Backend Developer (Node.js)",
    category: "IT",
    requirements: "3+ năm kinh nghiệm Node.js, biết TypeScript, RESTful API",
    benefits: "Lương 20-35 triệu, thưởng dự án, WFH 2 ngày/tuần",
    tone: "professional",
    contactInfo: "Gửi CV về: hr@company.com | Hotline: 0901 234 567",
  });

  // Test 2: Sales position, friendly tone
  await runTest("Sales Executive — Sales, friendly", {
    jobTitle: "Sales Executive",
    category: "SALES",
    requirements: "Có kinh nghiệm bán hàng B2B, nhanh nhẹn, chịu khó",
    benefits: "Thu nhập 15-25 triệu + hoa hồng hấp dẫn, xe máy hỗ trợ",
    tone: "friendly",
  });

  // Test 3: Minimal input — chỉ có jobTitle + category
  // Expect: missingFields có "contactInfo", body không có section Cách ứng tuyển bịa
  await runTest("Kế toán — GENERAL, minimal input", {
    jobTitle: "Kế toán tổng hợp",
    category: "GENERAL",
  });

  // Test 4: Full input — đầy đủ tất cả fields
  // Expect: missingFields = [], body có section Cách ứng tuyển đúng với input
  await runTest("Marketing Manager — MARKETING, full input", {
    jobTitle: "Marketing Manager",
    category: "MARKETING",
    requirements: "5 năm kinh nghiệm marketing B2C, thành thạo Google Ads, Meta Ads",
    benefits: "Lương 30-50 triệu, stock option, team building hàng quý",
    tone: "energetic",
    contactInfo: "Gửi CV: careers@company.com | Zalo: 0912 345 678",
  });
}

main().catch(console.error);

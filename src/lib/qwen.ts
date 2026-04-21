import OpenAI from "openai";

// ─── Client ──────────────────────────────────────────────────────────────────

export const QWEN_TEXT_MODEL = "qwen-plus";

// Lazy init để env vars kịp load trước khi tạo client
let _client: OpenAI | null = null;
function getClient(): OpenAI {
  if (!_client) {
    if (!process.env.DASHSCOPE_API_KEY) {
      throw new Error("Thiếu DASHSCOPE_API_KEY trong environment variables");
    }
    _client = new OpenAI({
      apiKey: process.env.DASHSCOPE_API_KEY,
      baseURL: process.env.DASHSCOPE_BASE_URL!,
    });
  }
  return _client;
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface GenerateInput {
  jobTitle: string;
  category: string;
  requirements?: string;
  benefits?: string;
  tone?: "professional" | "friendly" | "energetic";
  contactInfo?: string;
}

export interface GenerateOutput {
  body: string;
  hashtags: string[];
  suggestedTitle: string;
  missingFields: string[];
  warnings: string[];
}

// ─── Hashtag pool theo category ───────────────────────────────────────────────

const HASHTAG_POOLS: Record<string, string[]> = {
  IT: ["#tuyendung", "#it", "#developer", "#kinhghiemit", "#vieclamit", "#tuyendungit", "#laptrinhvien"],
  SALES: ["#tuyendung", "#sales", "#banhang", "#kinhghiemsales", "#tuyendungsales", "#kinhdoanh", "#vieclamtotnhat"],
  MARKETING: ["#tuyendung", "#marketing", "#digitalmarketing", "#contentmarketing", "#tuyendungmarketing", "#brandmarketing"],
  GENERAL: ["#tuyendung", "#vieclamdanhanh", "#tuyendunggapnhieu", "#vieclamhcm", "#tuyenngay", "#timviec"],
  OTHER: ["#tuyendung", "#vieclamdanhanh", "#tuyendunggapnhieu", "#vieclamhcm", "#timviec"],
};

const TONE_MAP = {
  professional: "chuyên nghiệp, lịch sự, súc tích",
  friendly: "thân thiện, gần gũi, ấm áp",
  energetic: "năng động, nhiệt huyết, truyền cảm hứng",
};

// ─── Retry helper ─────────────────────────────────────────────────────────────

async function callWithRetry<T>(
  fn: () => Promise<T>,
  retries = 1
): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    if (retries <= 0) throw err;
    // Chờ 1s rồi thử lại
    await new Promise((r) => setTimeout(r, 1000));
    return callWithRetry(fn, retries - 1);
  }
}

// ─── Main generate function ───────────────────────────────────────────────────

export async function generateRecruitmentContent(
  input: GenerateInput
): Promise<GenerateOutput> {
  const {
    jobTitle,
    category,
    requirements,
    benefits,
    tone = "professional",
    contactInfo,
  } = input;

  const hashtagPool = HASHTAG_POOLS[category] ?? HASHTAG_POOLS.GENERAL;
  const toneDesc = TONE_MAP[tone];

  const hasContactInfo = Boolean(contactInfo);

  const systemPrompt = `Bạn là chuyên gia viết content tuyển dụng cho mạng xã hội Facebook.
Nhiệm vụ: Viết bài đăng tuyển dụng tiếng Việt, giọng văn ${toneDesc}.

Yêu cầu bắt buộc:
1. Ngôn ngữ: 100% tiếng Việt
2. Độ dài nội dung (body): 200-400 từ
3. Format bài đăng Facebook với emoji và heading rõ ràng, theo thứ tự:
   - Dòng mở đầu hấp dẫn với emoji
   - 📌 VỊ TRÍ TUYỂN DỤNG
   - 💼 MÔ TẢ CÔNG VIỆC
   - ✅ YÊU CẦU ỨNG VIÊN
   - 🎁 QUYỀN LỢI
   ${hasContactInfo ? "- 📩 CÁCH ỨNG TUYỂN (dùng đúng thông tin từ input, không thêm gì khác)" : "- KHÔNG có section 📩 CÁCH ỨNG TUYỂN (contactInfo chưa được cung cấp)"}
4. Hashtag: 5-8 cái, chọn từ danh sách phù hợp với ngành: ${hashtagPool.join(" ")}
5. suggestedTitle: tên vị trí ngắn gọn để HR dễ tìm kiếm — KHÔNG thêm năm, quý, tháng (VD: "Backend Node.js" chứ KHÔNG phải "Backend Node.js - Q3 2025")

TUYỆT ĐỐI KHÔNG bịa thông tin không có trong input:
- Không tự thêm tên người liên hệ (VD: "Ms. Linh", "anh Minh", "chị Hoa")
- Không tự thêm số điện thoại, email, địa chỉ, tên công ty
- Không tự thêm deadline/hạn nộp hồ sơ dưới bất kỳ hình thức nào
- Không suy luận địa điểm từ ngữ cảnh (VD: "xe máy hỗ trợ" KHÔNG có nghĩa là công ty ở HCM)
- Body KHÔNG chứa hashtag — hashtag chỉ nằm trong field hashtags của JSON

Xử lý thông tin thiếu:
- Nếu input thiếu contactInfo → thêm "contactInfo" vào missingFields
- Nếu input thiếu requirements → thêm "requirements" vào missingFields và cảnh báo vào warnings
- Nếu input thiếu benefits → thêm "benefits" vào missingFields và cảnh báo vào warnings
- Nếu đủ thông tin → missingFields = [], warnings = []

Trả về JSON object hợp lệ với đúng 5 key sau, KHÔNG có text nào bên ngoài JSON:
{
  "body": "nội dung bài đăng hoàn chỉnh (không chứa hashtag)",
  "hashtags": ["#tag1", "#tag2", ...],
  "suggestedTitle": "tên vị trí ngắn, không có năm/quý/tháng",
  "missingFields": ["contactInfo"],
  "warnings": ["Chưa có thông tin liên hệ, cần bổ sung trước khi đăng"]
}`;

  const userPrompt = `Viết bài đăng tuyển dụng cho vị trí: ${jobTitle}
Ngành: ${category}
${requirements ? `Yêu cầu công việc: ${requirements}` : ""}
${benefits ? `Quyền lợi: ${benefits}` : ""}
${contactInfo ? `Thông tin liên hệ/ứng tuyển: ${contactInfo}` : ""}`;

  const result = await callWithRetry(async () => {
    const response = await getClient().chat.completions.create(
      {
        model: QWEN_TEXT_MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
      },
      { signal: AbortSignal.timeout(30_000) }
    );

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error("Qwen trả về response rỗng");

    let parsed: unknown;
    try {
      parsed = JSON.parse(content);
    } catch {
      throw new Error(`Không parse được JSON từ Qwen: ${content.slice(0, 200)}`);
    }

    // Validate output có đủ key cần thiết
    if (
      typeof parsed !== "object" ||
      parsed === null ||
      !("body" in parsed) ||
      !("hashtags" in parsed) ||
      !("suggestedTitle" in parsed)
    ) {
      throw new Error(`Output Qwen thiếu key bắt buộc: ${JSON.stringify(parsed)}`);
    }

    const output = parsed as GenerateOutput;

    // Đảm bảo hashtags là array
    if (!Array.isArray(output.hashtags)) {
      output.hashtags = String(output.hashtags).split(/\s+/).filter(Boolean);
    }

    // Đảm bảo missingFields và warnings là array (Qwen có thể bỏ sót)
    if (!Array.isArray(output.missingFields)) output.missingFields = [];
    if (!Array.isArray(output.warnings)) output.warnings = [];

    return output;
  });

  return result;
}

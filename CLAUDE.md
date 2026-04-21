# HR Recruitment Facebook Poster

## Mục đích dự án
Web app nội bộ cho bộ phận HR để:
1. Tạo content tuyển dụng (text + hình ảnh/video) bằng Qwen AI hoặc upload sẵn
2. Quản lý thư viện content: draft → approved → posted
3. Quản lý danh sách Facebook group (theo category: IT, Sales, Marketing...)
4. Hỗ trợ đăng bài: copy content vào clipboard + mở group trên FB (Phương án C)
5. Tracking: group nào đã đăng, ngày đăng, ai đăng

## Người dùng
- HR staff (non-technical) → UI đơn giản, tiếng Việt
- HR admin → quản lý template, group list, user

## Tech stack
- Framework: Next.js 14 (App Router) + TypeScript
- UI: Tailwind CSS + shadcn/ui
- Database: SQLite + Prisma ORM
- AI: Qwen DashScope (endpoint OpenAI-compatible)
  - Text: qwen-plus
  - Vision (nếu cần): qwen-vl-plus
- File upload: local folder `/public/uploads`
- Auth: NextAuth (credentials provider, đơn giản)

## Cấu trúc thư mục dự kiến
/src
/app                    # Next.js App Router
/api                  # API routes
/content            # CRUD content
/generate           # Gọi Qwen API
/groups             # CRUD group list
/post-log           # Tracking đăng bài
/(dashboard)          # UI chính cho HR
/content
/groups
/templates
/history
/components             # React components (shadcn/ui)
/lib                    # Helpers: qwen client, prisma client
/prisma                 # schema.prisma + migrations
/public/uploads           # Hình ảnh/video upload

## Quy ước code
- Comments + commit message tiếng Việt cho business logic
- Variable/function name tiếng Anh
- Không dùng `any` trong TypeScript trừ khi thực sự cần
- Mỗi API route có error handling + log rõ ràng

## AI prompt cho Qwen
- System prompt phải enforce: tiếng Việt, tone chuyên nghiệp, đúng format tuyển dụng
- Luôn include: vị trí, mô tả ngắn, quyền lợi, yêu cầu, cách apply
- Output có hashtag phù hợp với group (IT group → #tuyendung #it #developer)

## Security
- KHÔNG commit: `.env`, `.env.local`, `prisma/dev.db`, `/public/uploads`
- DashScope API key lưu trong `.env.local`
- NextAuth secret generate bằng `openssl rand -base64 32`

## Tham khảo project cũ
- tuvi-bot: pattern gọi Qwen qua OpenAI-compatible endpoint (DashScope)
  - Base URL: https://dashscope-intl.aliyuncs.com/compatible-mode/v1
  - Auth: Bearer token từ DASHSCOPE_API_KEY
- AI dashboard: pattern Next.js + Google Sheets + Claude (có thể tái sử dụng cấu trúc components)

## Claude workflow
- Dùng Plan Mode trước khi thay đổi >1 file
- Edit tối thiểu, không refactor ngoài scope
- Sau mỗi feature lớn: test manual + commit

## Roadmap
- [ ] Phase 1 (MVP): Content CRUD + Qwen generation + group list + copy-paste workflow
- [ ] Phase 2: Template system, scheduling, multi-user
- [ ] Phase 3: (Tùy quyết định) Puppeteer semi-automation với account phụ
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import bcryptjs from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Bắt đầu seed dữ liệu mẫu...");

  // 1 Admin user
  const hashedPassword = bcryptjs.hashSync("Admin@123", 10);
  const admin = await prisma.user.upsert({
    where: { email: "admin@company.com" },
    update: {},
    create: {
      name: "HR Admin",
      email: "admin@company.com",
      password: hashedPassword,
      role: "ADMIN",
    },
  });
  console.log(`✅ Admin user: ${admin.email}`);

  // 3 Facebook groups
  const groups = await Promise.all([
    prisma.fbGroup.upsert({
      where: { id: "seed-group-it" },
      update: {},
      create: {
        id: "seed-group-it",
        name: "Tuyển dụng IT Việt Nam",
        url: "https://www.facebook.com/groups/tuyendungit",
        category: "IT",
        isActive: true,
      },
    }),
    prisma.fbGroup.upsert({
      where: { id: "seed-group-sales" },
      update: {},
      create: {
        id: "seed-group-sales",
        name: "Việc làm Sales & Marketing HCM",
        url: "https://www.facebook.com/groups/vieclamhcm",
        category: "SALES",
        isActive: true,
      },
    }),
    prisma.fbGroup.upsert({
      where: { id: "seed-group-general" },
      update: {},
      create: {
        id: "seed-group-general",
        name: "HR Network Vietnam",
        url: "https://www.facebook.com/groups/hrnetworkvn",
        category: "GENERAL",
        isActive: true,
      },
    }),
  ]);

  groups.forEach((g) => console.log(`✅ FB Group: ${g.name} [${g.category}]`));

  console.log("\n🎉 Seed hoàn thành! 1 admin, 3 FB groups.");
}

main()
  .catch((e) => {
    console.error("❌ Seed thất bại:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

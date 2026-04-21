import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "HR Recruitment Poster",
  description: "Công cụ tạo và quản lý content tuyển dụng Facebook",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <body className="bg-gray-50 text-gray-900 antialiased">{children}</body>
    </html>
  );
}

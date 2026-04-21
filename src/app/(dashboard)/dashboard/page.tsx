import { Suspense } from "react";
import Link from "next/link";
import { FileText, CheckCircle, Users, TrendingUp, Sparkles } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({
  title,
  value,
  icon: Icon,
  description,
}: {
  title: string;
  value: number;
  icon: React.ElementType;
  description: string;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className="size-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">{value}</div>
        <p className="mt-1 text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}

function StatsSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i}>
          <CardHeader className="pb-2">
            <Skeleton className="h-4 w-32" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-9 w-16" />
            <Skeleton className="mt-2 h-3 w-40" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ─── Async stats component (fetches from DB) ──────────────────────────────────

async function DashboardStats() {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [totalContent, approvedContent, activeGroups, recentPosts] = await Promise.all([
    prisma.content.count(),
    prisma.content.count({ where: { status: "APPROVED" } }),
    prisma.fbGroup.count({ where: { isActive: true } }),
    prisma.postLog.count({ where: { postedAt: { gte: sevenDaysAgo } } }),
  ]);

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="Tổng bài đã tạo"
        value={totalContent}
        icon={FileText}
        description="Tất cả bài đăng trong hệ thống"
      />
      <StatCard
        title="Sẵn sàng đăng"
        value={approvedContent}
        icon={CheckCircle}
        description="Bài đã được duyệt (Approved)"
      />
      <StatCard
        title="Nhóm đang hoạt động"
        value={activeGroups}
        icon={Users}
        description="Nhóm Facebook đang kích hoạt"
      />
      <StatCard
        title="Lượt đăng 7 ngày"
        value={recentPosts}
        icon={TrendingUp}
        description="Bài đã đăng trong 7 ngày qua"
      />
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Tổng quan</h2>
          <p className="text-sm text-muted-foreground">
            Quản lý content tuyển dụng Facebook của bạn
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/create">
            <Sparkles className="size-4" />
            Tạo bài mới
          </Link>
        </Button>
      </div>

      {/* Stat cards */}
      <Suspense fallback={<StatsSkeleton />}>
        <DashboardStats />
      </Suspense>

      {/* Quick tips */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Bắt đầu nhanh</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>1. Nhấn <strong>Tạo bài mới</strong> để AI tự động soạn nội dung tuyển dụng.</p>
          <p>2. Kiểm tra và chỉnh sửa nội dung trong <strong>Thư viện content</strong>.</p>
          <p>3. Copy nội dung và đăng lên các <strong>Nhóm Facebook</strong> phù hợp.</p>
        </CardContent>
      </Card>
    </div>
  );
}

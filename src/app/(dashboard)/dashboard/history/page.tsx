import { Card, CardContent } from "@/components/ui/card";

export default function HistoryPage() {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Lịch sử đăng</h2>
        <p className="text-sm text-muted-foreground">
          Theo dõi bài nào đã đăng, nhóm nào, ngày nào
        </p>
      </div>
      <div className="flex items-center justify-center py-16">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <p className="text-4xl mb-4">📊</p>
            <p className="font-medium">Tính năng đang được xây dựng</p>
            <p className="mt-1 text-sm text-muted-foreground">Coming in Step 5</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

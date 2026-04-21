"use client";

import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { useExtensionPosting } from "@/hooks/use-extension-posting";
import { buildExtensionJobs } from "@/lib/extension-payload";
import type { ContentItem, GroupItem } from "../_hooks/use-posting-session";

interface Props {
  content: ContentItem;
  groups: GroupItem[];
  extensionVersion: string | null;
  onReset: () => void;
}

const STATUS_ICON: Record<string, string> = {
  pending: "⏳",
  running: "⏳",
  success: "✅",
  failed: "❌",
};

export function ExtensionPostingPanel({ content, groups, extensionVersion, onReset }: Props) {
  const { state, startPosting, stopPosting, reset } = useExtensionPosting();
  const { isPosting, isDone, error, jobs, doneCount, totalCount } = state;

  const groupMap = useMemo(
    () => Object.fromEntries(groups.map((g) => [g.id, g])),
    [groups]
  );

  function handleStart() {
    const postJobs = buildExtensionJobs(content, groups);
    startPosting(postJobs, content.id);
  }

  function handleReset() {
    reset();
    onReset();
  }

  const successCount = jobs.filter((j) => j.status === "success").length;
  const failedCount = jobs.filter((j) => j.status === "failed").length;

  // Extension chưa cài hoặc bị disabled
  if (!extensionVersion) {
    return (
      <div className="rounded-xl border-2 border-dashed border-muted bg-muted/30 p-8 text-center space-y-3">
        <p className="text-3xl">🔌</p>
        <p className="font-semibold">Extension chưa được cài</p>
        <p className="text-sm text-muted-foreground">
          Cài extension &quot;HR Recruitment Poster&quot; vào Chrome để dùng tính năng đăng tự động.
        </p>
        <p className="text-xs text-muted-foreground">
          Sau khi cài, reload lại trang này.
        </p>
      </div>
    );
  }

  // Sau khi queue hoàn thành
  if (isDone) {
    return (
      <div className="rounded-xl border bg-background p-6 space-y-4">
        <div className="text-center space-y-2">
          <p className="text-3xl">{successCount === groups.length ? "🎉" : "📊"}</p>
          <h3 className="text-xl font-bold">Extension đã hoàn thành!</h3>
          <p className="text-sm text-muted-foreground">
            Đã đăng <strong>{content.title}</strong> vào {successCount}/{groups.length} group
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg border p-3 text-center">
            <p className="text-2xl font-bold text-green-600">{successCount}</p>
            <p className="text-xs text-muted-foreground">✅ Thành công</p>
          </div>
          <div className="rounded-lg border p-3 text-center">
            <p className="text-2xl font-bold text-red-600">{failedCount}</p>
            <p className="text-xs text-muted-foreground">❌ Thất bại</p>
          </div>
        </div>

        {failedCount > 0 && (
          <div className="rounded-lg bg-red-50 border border-red-200 p-3 space-y-1">
            <p className="text-xs font-semibold text-red-700">Lý do thất bại:</p>
            {jobs
              .filter((j) => j.status === "failed")
              .map((j) => (
                <div key={j.jobId} className="text-xs text-red-600">
                  <span className="font-medium">{groupMap[j.groupId]?.name ?? j.groupId}</span>
                  {j.error ? `: ${j.error}` : ""}
                </div>
              ))}
          </div>
        )}

        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" onClick={handleReset}>
            Đăng content khác
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border-2 border-primary/20 bg-background shadow-sm p-6 space-y-5">
      {/* Extension status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-green-600 font-semibold text-sm">
            ✅ Extension v{extensionVersion} sẵn sàng
          </span>
        </div>
        <span className="text-xs text-muted-foreground">{groups.length} group đã chọn</span>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-300 px-4 py-3 text-sm text-red-700">
          ⚠️ {error}
        </div>
      )}

      {/* Before start */}
      {!isPosting && jobs.length === 0 && !error && (
        <div className="space-y-3">
          <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 text-xs text-blue-700 space-y-1">
            <p className="font-semibold">Extension sẽ tự động:</p>
            <p>• Mở từng Facebook group trong tab mới</p>
            <p>• Điền nội dung + đính kèm ảnh</p>
            <p>• Click đăng và đợi xác nhận</p>
            <p>• Đợi 1-3 phút giữa các group (chống spam)</p>
          </div>
          <Button size="lg" className="w-full text-base gap-2" onClick={handleStart}>
            🚀 Bắt đầu đăng tự động ({groups.length} group)
          </Button>
        </div>
      )}

      {/* Progress */}
      {(isPosting || (jobs.length > 0 && !isDone)) && (
        <div className="space-y-4">
          {/* Progress bar */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-sm font-medium">
              <span>Tiến độ</span>
              <span>{doneCount}/{totalCount} group</span>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-500"
                style={{ width: totalCount > 0 ? `${(doneCount / totalCount) * 100}%` : "0%" }}
              />
            </div>
            <div className="flex gap-4 text-xs text-muted-foreground">
              <span>✅ {successCount} thành công</span>
              <span>❌ {failedCount} thất bại</span>
              <span>⏳ {totalCount - doneCount} còn lại</span>
            </div>
          </div>

          {/* Job list */}
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {jobs.map((job) => {
              const group = groupMap[job.groupId];
              const isRunning = job.status === "running";
              return (
                <div
                  key={job.jobId}
                  className={`flex items-center gap-3 rounded-lg border px-3 py-2 text-sm transition-colors ${
                    isRunning ? "border-primary bg-primary/5" : ""
                  }`}
                >
                  <span className={isRunning ? "animate-spin" : ""}>
                    {isRunning ? "⏳" : STATUS_ICON[job.status]}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{group?.name ?? job.groupId}</p>
                    {job.status === "failed" && job.error && (
                      <p className="text-xs text-red-500 truncate">{job.error}</p>
                    )}
                    {isRunning && (
                      <p className="text-xs text-primary">Đang đăng...</p>
                    )}
                  </div>
                  <span className={`text-xs font-medium ${
                    job.status === "success" ? "text-green-600" :
                    job.status === "failed" ? "text-red-600" :
                    job.status === "running" ? "text-primary" :
                    "text-muted-foreground"
                  }`}>
                    {job.status === "pending" ? "Chờ" :
                     job.status === "running" ? "Đang chạy" :
                     job.status === "success" ? "Thành công" : "Thất bại"}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Stop button */}
          {isPosting && (
            <Button
              variant="outline"
              className="w-full border-red-300 text-red-600 hover:bg-red-50"
              onClick={stopPosting}
            >
              🛑 Dừng
            </Button>
          )}

          {/* Note about delay */}
          {isPosting && (
            <p className="text-xs text-center text-muted-foreground">
              Extension đang chạy nền — đừng đóng trình duyệt. Mỗi group cách nhau 1-3 phút.
            </p>
          )}
        </div>
      )}

      {/* After error — retry */}
      {error && !isPosting && (
        <Button className="w-full" onClick={handleStart}>
          Thử lại
        </Button>
      )}
    </div>
  );
}

"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import {
  AlertDialog, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import type { FbGroupItem } from "./group-table";

interface DeleteGroupDialogProps {
  group: FbGroupItem | null;
  onClose: () => void;
  onDeleted: () => void;
}

export function DeleteGroupDialog({ group, onClose, onDeleted }: DeleteGroupDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  // "idle" | "has-postlogs" — trạng thái sau khi server trả 409
  const [conflictInfo, setConflictInfo] = useState<{ postLogCount: number } | null>(null);

  async function handleDelete(force = false) {
    if (!group) return;
    setIsDeleting(true);
    try {
      const url = `/api/groups/${group.id}${force ? "?force=true" : ""}`;
      const res = await fetch(url, { method: "DELETE" });
      const json = await res.json();

      if (res.status === 409 && json.error === "GROUP_HAS_POSTLOGS") {
        setConflictInfo({ postLogCount: json.postLogCount });
        setIsDeleting(false);
        return;
      }
      if (!res.ok) throw new Error(json.error ?? "Xoá thất bại");

      toast.success(`Đã xoá group "${group.name}"`);
      onDeleted();
      handleClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Xoá thất bại");
      setIsDeleting(false);
    }
  }

  async function handleDeactivate() {
    if (!group) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/groups/${group.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: false }),
      });
      if (!res.ok) throw new Error("Cập nhật thất bại");
      toast.success(`Đã chuyển "${group.name}" sang không active`);
      onDeleted();
      handleClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Cập nhật thất bại");
    } finally {
      setIsDeleting(false);
    }
  }

  function handleClose() {
    setConflictInfo(null);
    onClose();
  }

  const postLogCount = conflictInfo?.postLogCount ?? group?._count?.postLogs ?? 0;

  return (
    <AlertDialog open={!!group} onOpenChange={(o) => { if (!o) handleClose(); }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Xoá group &ldquo;{group?.name}&rdquo;?</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3 text-sm">
              {!conflictInfo ? (
                <p>
                  Group sẽ biến mất khỏi danh sách đăng bài.
                  {postLogCount > 0
                    ? ` Group này có ${postLogCount} lần đăng bài trong lịch sử.`
                    : " Group chưa có lịch sử đăng bài nào."}
                </p>
              ) : (
                <>
                  <p>
                    Group này đã có <strong>{conflictInfo.postLogCount} lần đăng bài</strong> trong lịch sử.
                    Bạn muốn xử lý thế nào?
                  </p>
                  <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-amber-800">
                    💡 Đề xuất: Chuyển sang &ldquo;không active&rdquo; — giữ lịch sử, ẩn khỏi danh sách đăng bài.
                  </div>
                </>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-wrap gap-2">
          <AlertDialogCancel onClick={handleClose} disabled={isDeleting}>Huỷ</AlertDialogCancel>

          {conflictInfo ? (
            <>
              <Button
                variant="outline"
                onClick={handleDeactivate}
                disabled={isDeleting}
                className="gap-2"
              >
                {isDeleting && <Loader2 className="size-4 animate-spin" />}
                Chuyển sang không active
              </Button>
              <Button
                variant="destructive"
                onClick={() => handleDelete(true)}
                disabled={isDeleting}
                className="gap-2"
              >
                {isDeleting && <Loader2 className="size-4 animate-spin" />}
                Xoá cả lịch sử
              </Button>
            </>
          ) : (
            <Button
              variant="destructive"
              onClick={() => handleDelete(false)}
              disabled={isDeleting}
              className="gap-2"
            >
              {isDeleting && <Loader2 className="size-4 animate-spin" />}
              Xoá group
            </Button>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { X, Film, Loader2, Save, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { HashtagEditor } from "../../create/_components/hashtag-editor";

// ─── Types ────────────────────────────────────────────────────────────────────

interface MediaRecord {
  id: string;
  url: string;
  type: string;
  originalName: string;
}

interface ContentDetail {
  id: string;
  title: string;
  position: string;
  description: string;
  hashtags: string;
  status: "DRAFT" | "APPROVED" | "POSTED" | "ARCHIVED";
  createdAt: string;
  author: { name: string };
  medias: MediaRecord[];
  _count: { postLogs: number };
}

type ContentStatus = "DRAFT" | "APPROVED" | "POSTED" | "ARCHIVED";

const STATUS_LABELS: Record<ContentStatus, string> = {
  DRAFT:    "Nháp",
  APPROVED: "Đã duyệt",
  POSTED:   "Đã đăng",
  ARCHIVED: "Đã lưu trữ",
};

// ─── Component ────────────────────────────────────────────────────────────────

interface ContentDetailDialogProps {
  contentId: string | null;
  onClose: () => void;
  onUpdated: () => void;
  onDeleted: () => void;
}

export function ContentDetailDialog({
  contentId, onClose, onUpdated, onDeleted,
}: ContentDetailDialogProps) {
  const [content, setContent] = useState<ContentDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Edit state
  const [editTitle, setEditTitle] = useState("");
  const [editBody, setEditBody] = useState("");
  const [editHashtags, setEditHashtags] = useState<string[]>([]);
  const [editStatus, setEditStatus] = useState<ContentStatus>("DRAFT");
  const [medias, setMedias] = useState<MediaRecord[]>([]);

  const hasChanges =
    content !== null && (
      editTitle !== content.title ||
      editBody !== content.description ||
      editHashtags.join(" ") !== content.hashtags ||
      editStatus !== content.status
    );

  // Fetch detail khi mở dialog
  useEffect(() => {
    if (!contentId) {
      setContent(null);
      return;
    }
    setIsLoading(true);
    fetch(`/api/content/${contentId}`)
      .then((r) => r.json())
      .then((json) => {
        const c: ContentDetail = json.data;
        setContent(c);
        setEditTitle(c.title);
        setEditBody(c.description);
        setEditHashtags(c.hashtags ? c.hashtags.split(" ").filter(Boolean) : []);
        setEditStatus(c.status);
        setMedias(c.medias);
      })
      .catch(() => toast.error("Không tải được nội dung"))
      .finally(() => setIsLoading(false));
  }, [contentId]);

  function handleClose() {
    if (hasChanges) {
      if (!window.confirm("Thoát mà không lưu thay đổi?")) return;
    }
    onClose();
  }

  async function handleSave() {
    if (!content) return;
    setIsSaving(true);
    try {
      const res = await fetch(`/api/content/${content.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: editTitle, description: editBody, hashtags: editHashtags, status: editStatus }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Lưu thất bại");
      const updated = (await res.json()).data as ContentDetail;
      setContent(updated);
      setEditTitle(updated.title);
      setEditBody(updated.description);
      setEditHashtags(updated.hashtags ? updated.hashtags.split(" ").filter(Boolean) : []);
      setEditStatus(updated.status);
      toast.success("Đã lưu thay đổi");
      onUpdated();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Lưu thất bại");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleStatusChange(newStatus: ContentStatus) {
    if (!content) return;
    if (newStatus === "ARCHIVED" && content.status === "APPROVED") {
      if (!window.confirm("Bài sẽ bị ẩn khỏi danh sách đăng. Tiếp tục?")) return;
    }
    setEditStatus(newStatus);
  }

  async function handleDeleteMedia(mediaId: string) {
    if (!content) return;
    try {
      const res = await fetch(`/api/content/${content.id}/media/${mediaId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Xoá media thất bại");
      setMedias((prev) => prev.filter((m) => m.id !== mediaId));
      toast.success("Đã xoá ảnh/video");
    } catch {
      toast.error("Không xoá được ảnh/video");
    }
  }

  async function handleDelete() {
    if (!content) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/content/${content.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json()).error ?? "Xoá thất bại");
      toast.success("Đã xoá bài đăng");
      setShowDeleteConfirm(false);
      onDeleted();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Xoá thất bại");
    } finally {
      setIsDeleting(false);
    }
  }

  const isOpen = contentId !== null;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleClose(); }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              Chi tiết bài đăng
              {hasChanges && (
                <span className="inline-block size-2 rounded-full bg-yellow-400" title="Có thay đổi chưa lưu" />
              )}
            </DialogTitle>
          </DialogHeader>

          {isLoading ? (
            <div className="flex h-40 items-center justify-center">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : content ? (
            <div className="space-y-5">
              {/* Tiêu đề */}
              <div className="space-y-1.5">
                <Label>Tiêu đề nội bộ</Label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                />
              </div>

              {/* Nội dung bài đăng */}
              <div className="space-y-1.5">
                <Label>Nội dung bài đăng</Label>
                <Textarea
                  value={editBody}
                  onChange={(e) => setEditBody(e.target.value)}
                  rows={12}
                  className="font-mono text-sm"
                />
                <p className={editBody.length > 2000 ? "text-xs text-destructive" : "text-xs text-muted-foreground"}>
                  {editBody.length} ký tự
                  {editBody.length > 2000 ? " — Bài quá dài, FB có thể cắt bớt" : ""}
                </p>
              </div>

              {/* Hashtag */}
              <div className="space-y-1.5">
                <Label>Hashtag</Label>
                <HashtagEditor hashtags={editHashtags} onChange={setEditHashtags} />
              </div>

              <Separator />

              {/* Media gallery */}
              {medias.length > 0 && (
                <div className="space-y-2">
                  <Label>Ảnh/Video đính kèm ({medias.length})</Label>
                  <div className="grid grid-cols-4 gap-2">
                    {medias.map((media) => (
                      <div key={media.id} className="group relative aspect-square overflow-hidden rounded-lg border bg-muted/30">
                        {media.type === "IMAGE" ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={media.url}
                            alt={media.originalName}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center">
                            <Film className="size-8 text-muted-foreground" />
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDeleteMedia(media.id)}
                          className="absolute right-1 top-1 rounded-full bg-destructive p-0.5 text-white opacity-0 transition-opacity group-hover:opacity-100"
                        >
                          <X className="size-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <Separator />

              {/* Metadata + Status */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Ngày tạo</p>
                  <p>{new Date(content.createdAt).toLocaleString("vi-VN")}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Tác giả</p>
                  <p>{content.author.name}</p>
                </div>
              </div>

              {/* Status selector */}
              <div className="space-y-1.5">
                <Label>Trạng thái</Label>
                <Select value={editStatus} onValueChange={(v) => handleStatusChange(v as ContentStatus)}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(STATUS_LABELS) as ContentStatus[]).map((s) => (
                      <SelectItem key={s} value={s}>{STATUS_LABELS[s]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          ) : null}

          <DialogFooter className="flex-wrap gap-2 pt-2">
            <Button
              type="button"
              variant="destructive"
              onClick={() => setShowDeleteConfirm(true)}
              disabled={!content || isDeleting}
              className="mr-auto gap-2"
            >
              <Trash2 className="size-4" />
              Xoá
            </Button>
            <Button type="button" variant="outline" onClick={handleClose}>
              Đóng
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              disabled={!hasChanges || isSaving}
              className="gap-2"
            >
              {isSaving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
              Lưu thay đổi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm xoá */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xoá bài đăng?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2">
                <p>
                  Bạn có chắc muốn xoá <strong>&ldquo;{content?.title}&rdquo;</strong>?
                  {medias.length > 0 && ` Thao tác này sẽ xoá cả ${medias.length} ảnh/video đính kèm và`}
                  {medias.length === 0 && " Thao tác này"} KHÔNG thể hoàn tác.
                </p>
                {(content?._count?.postLogs ?? 0) > 0 && (
                  <p className="rounded bg-amber-50 px-3 py-2 text-amber-800 text-sm">
                    ⚠️ Bài này đã được đăng lên {content!._count.postLogs} group.
                    Lịch sử đăng vẫn giữ nhưng không xem lại được nội dung gốc.
                  </p>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Huỷ</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? <Loader2 className="size-4 animate-spin" /> : "Xoá vĩnh viễn"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

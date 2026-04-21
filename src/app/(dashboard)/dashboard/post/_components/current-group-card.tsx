"use client";

import { useState } from "react";
import { toast } from "sonner";
import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle,
  AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { copyToClipboard } from "../_hooks/use-clipboard";
import type { ContentItem, GroupItem, PostingPhase } from "../_hooks/use-posting-session";

const FAIL_REASONS = [
  "Group cần admin approve",
  "Bị FB chặn",
  "Group đã xoá",
  "Không vào được group",
  "Khác",
];

interface Props {
  group: GroupItem;
  content: ContentItem;
  phase: PostingPhase;
  absolutePath: string | null;
  mediaCount: number;
  onPhaseChange: (phase: PostingPhase) => void;
  onSuccess: (postUrl?: string) => void;
  onFail: (reason: string) => void;
}

export function CurrentGroupCard({
  group, content, phase, absolutePath, mediaCount,
  onPhaseChange, onSuccess, onFail,
}: Props) {
  const [postUrl, setPostUrl] = useState("");
  const [failReason, setFailReason] = useState("");
  const [customReason, setCustomReason] = useState("");
  const [showFailDialog, setShowFailDialog] = useState(false);
  const [hasCopied, setHasCopied] = useState(false);
  const [hasOpened, setHasOpened] = useState(false);

  const hashtagStr = content.hashtags ?? "";
  const copyText = [content.description, hashtagStr].filter(Boolean).join("\n\n");

  async function handleCopy() {
    const ok = await copyToClipboard(copyText);
    if (ok) {
      toast.success("✅ Đã copy. Mở group Facebook và Ctrl+V để dán.");
      setHasCopied(true);
      onPhaseChange("copying");
    } else {
      toast.error("Không copy được — hãy copy thủ công");
    }
  }

  async function handleCopyPath() {
    if (!absolutePath) return;
    await copyToClipboard(absolutePath);
    toast.success("Đã copy đường dẫn folder ảnh");
  }

  async function handleOpenFolder() {
    if (!absolutePath) return;
    try {
      await fetch("/api/open-folder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: absolutePath }),
      });
    } catch { /* ignore */ }
  }

  function handleOpenGroup() {
    window.open(group.url, "_blank");
    setHasOpened(true);
    onPhaseChange("opened");
    toast.info("Tab đã mở. Ctrl+V vào ô đăng bài → đính kèm ảnh → click Đăng.");
  }

  function handleSuccess() {
    onSuccess(postUrl || undefined);
    setPostUrl("");
    setHasCopied(false);
    setHasOpened(false);
  }

  function handleConfirmFail() {
    const reason = failReason === "Khác" ? customReason : failReason;
    if (!reason) return;
    onFail(reason);
    setShowFailDialog(false);
    setFailReason("");
    setCustomReason("");
    setHasCopied(false);
    setHasOpened(false);
  }

  return (
    <>
      <div className="rounded-xl border-2 border-primary/20 bg-background shadow-sm p-6 space-y-5">
        {/* Group info */}
        <div>
          <h3 className="text-xl font-bold">{group.name}</h3>
          <a
            href={group.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-600 hover:underline flex items-center gap-1 mt-0.5"
          >
            {group.url}
            <ExternalLink className="size-3" />
          </a>
          {group.memberCount != null && (
            <p className="text-xs text-muted-foreground mt-1">
              {group.memberCount.toLocaleString()} thành viên
            </p>
          )}
        </div>

        {/* 3 action buttons */}
        <div className="space-y-3">
          {/* Step 1: Copy */}
          <div className="space-y-2">
            <Button
              size="lg"
              className="w-full text-base gap-2"
              variant={hasCopied ? "outline" : "default"}
              onClick={handleCopy}
              data-action="copy"
            >
              {hasCopied ? "✅ Đã copy (bấm để copy lại)" : "📋 Bước 1: Copy nội dung"}
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              C = Copy nhanh
            </p>

            {hasCopied && mediaCount > 0 && absolutePath && (
              <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 space-y-2">
                <p className="text-xs text-blue-700 font-medium">📎 Có {mediaCount} file media đính kèm</p>
                <p className="text-xs text-blue-600">Đường dẫn folder ảnh:</p>
                <div className="flex gap-2">
                  <code className="flex-1 text-[11px] bg-white border rounded px-2 py-1 truncate">
                    {absolutePath}
                  </code>
                  <Button size="sm" variant="outline" className="shrink-0 text-xs" onClick={handleCopyPath}>
                    📋 Copy
                  </Button>
                  <Button size="sm" variant="outline" className="shrink-0 text-xs" onClick={handleOpenFolder}>
                    📁 Mở
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Step 2: Open */}
          <div className="space-y-1">
            <Button
              size="lg"
              variant="secondary"
              className="w-full text-base gap-2"
              onClick={handleOpenGroup}
              data-action="open"
            >
              {hasOpened ? "✅ Đã mở tab (bấm để mở lại)" : "🌐 Bước 2: Mở Facebook Group"}
            </Button>
            <p className="text-xs text-muted-foreground text-center">O = Mở nhanh</p>
          </div>

          {/* Step 3: Confirm */}
          <div className="space-y-2">
            <div className="flex gap-2">
              <Button
                size="lg"
                className="flex-1 text-base gap-2 bg-green-600 hover:bg-green-700 text-white"
                onClick={handleSuccess}
                data-action="success"
              >
                ✅ Bước 3: Tôi đã đăng xong
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="flex-1 text-base gap-2 border-red-300 text-red-600 hover:bg-red-50"
                onClick={() => setShowFailDialog(true)}
                data-action="fail"
              >
                ❌ Không đăng được
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Input
                placeholder="Dán link bài đăng (tuỳ chọn)..."
                value={postUrl}
                onChange={(e) => setPostUrl(e.target.value)}
                className="text-sm"
              />
            </div>
            <p className="text-xs text-muted-foreground text-center">Y = Đã đăng • N = Không đăng được</p>
          </div>
        </div>
      </div>

      {/* Fail dialog */}
      <AlertDialog open={showFailDialog} onOpenChange={setShowFailDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Lý do không đăng được?</AlertDialogTitle>
            <AlertDialogDescription>Chọn lý do để lưu vào lịch sử</AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2">
            {FAIL_REASONS.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setFailReason(r)}
                className={`w-full text-left rounded-lg border px-3 py-2 text-sm transition-colors hover:bg-accent ${failReason === r ? "border-primary bg-primary/5" : ""}`}
              >
                {r}
              </button>
            ))}
            {failReason === "Khác" && (
              <Input
                placeholder="Nhập lý do..."
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                autoFocus
              />
            )}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Huỷ</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmFail}
              disabled={!failReason || (failReason === "Khác" && !customReason)}
              className="bg-red-600 hover:bg-red-700"
            >
              Xác nhận
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

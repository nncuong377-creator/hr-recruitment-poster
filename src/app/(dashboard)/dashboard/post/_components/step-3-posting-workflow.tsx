"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { CurrentGroupCard } from "./current-group-card";
import { DelayCountdown } from "./delay-countdown";
import { PostingQueueList } from "./posting-queue-list";
import { CompletionModal } from "./completion-modal";
import { ExtensionPostingPanel } from "./extension-posting-panel";
import { useKeyboardShortcuts } from "../_hooks/use-keyboard-shortcuts";
import { useExtension } from "@/hooks/use-extension";
import type { ContentItem, GroupItem, GroupStatus, PostingPhase } from "../_hooks/use-posting-session";

interface Props {
  content: ContentItem;
  groups: GroupItem[];
  currentIndex: number;
  statusMap: Record<string, GroupStatus>;
  phase: PostingPhase;
  sessionId: string | null;
  absolutePath: string | null;
  mediaCount: number;
  isPaused: boolean;
  isDone: boolean;
  onPhaseChange: (phase: PostingPhase) => void;
  onMarkStatus: (groupId: string, status: GroupStatus) => void;
  onNextGroup: () => void;
  onJumpTo: (index: number) => void;
  onPause: () => void;
  onResume: () => void;
  onReset: () => void;
  onSetSession: (sessionId: string | null, absolutePath: string | null, mediaCount: number) => void;
  saveToStorage: (content: ContentItem, groups: GroupItem[], index: number, statusMap: Record<string, GroupStatus>) => void;
  clearStorage: () => void;
}

type PostingMode = "extension" | "copy-paste";

export function Step3PostingWorkflow({
  content, groups, currentIndex, statusMap, phase,
  sessionId, absolutePath, mediaCount, isPaused, isDone,
  onPhaseChange, onMarkStatus, onNextGroup, onJumpTo, onPause, onResume, onReset,
  onSetSession, saveToStorage, clearStorage,
}: Props) {
  const extensionInfo = useExtension();
  const [postingMode, setPostingMode] = useState<PostingMode>("copy-paste");
  const [errorMsgMap, setErrorMsgMap] = useState<Record<string, string>>({});
  const [showCompletion, setShowCompletion] = useState(false);
  const autoNextTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Khi extension được phát hiện lần đầu, tự động chọn extension mode
  useEffect(() => {
    if (extensionInfo.installed) {
      setPostingMode("extension");
    }
  }, [extensionInfo.installed]);

  const currentGroup = groups[currentIndex] ?? null;
  const successCount = groups.filter((g) => statusMap[g.id] === "success").length;
  const failedCount = groups.filter((g) => statusMap[g.id] === "failed").length;
  const skippedCount = groups.filter((g) => statusMap[g.id] === "skipped").length;
  const pendingCount = groups.filter((g) => statusMap[g.id] === "pending").length;

  // Create staging folder on mount (only needed for copy-paste mode)
  useEffect(() => {
    if (content.medias.length === 0) return;
    fetch("/api/posting-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contentId: content.id }),
    })
      .then((r) => r.json())
      .then((j) => onSetSession(j.sessionId ?? null, j.absolutePath ?? null, j.mediaCount ?? 0))
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cleanup staging folder on unmount
  useEffect(() => {
    return () => {
      if (sessionId) {
        fetch(`/api/posting-session/${sessionId}`, { method: "DELETE" }).catch(() => {});
      }
    };
  }, [sessionId]);

  // Show completion when copy-paste mode is done
  useEffect(() => {
    if (isDone && !showCompletion && postingMode === "copy-paste") {
      setShowCompletion(true);
      clearStorage();
      groups.forEach((g) => {
        if (statusMap[g.id] === "pending") {
          onMarkStatus(g.id, "skipped");
        }
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDone]);

  // Persist to localStorage (copy-paste mode only)
  useEffect(() => {
    if (!isDone && postingMode === "copy-paste") {
      saveToStorage(content, groups, currentIndex, statusMap);
    }
  }, [content, groups, currentIndex, statusMap, isDone, postingMode, saveToStorage]);

  const handleSuccess = useCallback(async (postUrl?: string) => {
    if (!currentGroup) return;
    try {
      await fetch("/api/post-log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contentId: content.id, fbGroupId: currentGroup.id, status: "SUCCESS", postUrl }),
      });
      onMarkStatus(currentGroup.id, "success");
      toast.success(`✅ Đã log: ${currentGroup.name}`);
      autoNextTimer.current = setTimeout(() => {
        onNextGroup();
        onPhaseChange("delay");
      }, 2000);
    } catch {
      toast.error("Lỗi khi lưu log");
    }
  }, [currentGroup, content.id, onMarkStatus, onNextGroup, onPhaseChange]);

  const handleFail = useCallback(async (reason: string) => {
    if (!currentGroup) return;
    try {
      await fetch("/api/post-log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contentId: content.id, fbGroupId: currentGroup.id, status: "FAILED", errorMsg: reason }),
      });
      onMarkStatus(currentGroup.id, "failed");
      setErrorMsgMap((prev) => ({ ...prev, [currentGroup.id]: reason }));
      toast.error(`❌ Đã ghi nhận: ${currentGroup.name}`);
      onNextGroup();
    } catch {
      toast.error("Lỗi khi lưu log");
    }
  }, [currentGroup, content.id, onMarkStatus, onNextGroup]);

  // Keyboard shortcuts — chỉ active khi copy-paste mode
  useKeyboardShortcuts({
    active: postingMode === "copy-paste" && !isDone && !isPaused && phase !== "delay",
    onCopy: () => document.querySelector<HTMLButtonElement>("[data-action='copy']")?.click(),
    onOpen: () => document.querySelector<HTMLButtonElement>("[data-action='open']")?.click(),
    onSuccess: () => document.querySelector<HTMLButtonElement>("[data-action='success']")?.click(),
    onFail: () => document.querySelector<HTMLButtonElement>("[data-action='fail']")?.click(),
    onSkipDelay: () => { if (phase === "delay") onPhaseChange("idle"); },
    onPause: () => { isPaused ? onResume() : onPause(); },
  });

  function handleStop() {
    if (!window.confirm("Dừng hẳn session? Progress sẽ được lưu lại.")) return;
    clearStorage();
    onReset();
  }

  return (
    <div className="space-y-4">
      {/* Mode toggle */}
      <div className="rounded-xl border bg-background p-4 space-y-3">
        <p className="text-sm font-semibold text-muted-foreground">Cơ chế đăng bài</p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setPostingMode("extension")}
            className={`flex-1 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors ${
              postingMode === "extension"
                ? "border-primary bg-primary/5 text-primary"
                : "border-muted-foreground/20 text-muted-foreground hover:bg-muted"
            }`}
          >
            🤖 Tự động qua Extension
            {extensionInfo.installed && (
              <span className="ml-1.5 text-xs text-green-600">✓ Đã cài</span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setPostingMode("copy-paste")}
            className={`flex-1 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors ${
              postingMode === "copy-paste"
                ? "border-primary bg-primary/5 text-primary"
                : "border-muted-foreground/20 text-muted-foreground hover:bg-muted"
            }`}
          >
            📋 Copy-Paste thủ công
          </button>
        </div>
      </div>

      {/* Extension mode */}
      {postingMode === "extension" && (
        <ExtensionPostingPanel
          content={content}
          groups={groups}
          extensionVersion={extensionInfo.version}
          onReset={onReset}
        />
      )}

      {/* Copy-paste mode */}
      {postingMode === "copy-paste" && (
        <>
          {/* Progress bar */}
          <div className="rounded-xl border bg-background p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="font-semibold">
                Đang đăng bài {Math.min(currentIndex + 1, groups.length)}/{groups.length} group
              </p>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => isPaused ? onResume() : onPause()}>
                  {isPaused ? "▶️ Tiếp tục" : "⏸️ Tạm dừng"}
                </Button>
                <Button size="sm" variant="outline" onClick={handleStop} className="text-red-600 border-red-300 hover:bg-red-50">
                  🛑 Dừng hẳn
                </Button>
              </div>
            </div>

            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${(currentIndex / groups.length) * 100}%` }}
              />
            </div>

            <div className="flex gap-4 text-sm">
              <span>✅ Thành công: <strong>{successCount}</strong></span>
              <span>❌ Thất bại: <strong>{failedCount}</strong></span>
              <span>⏭️ Bỏ qua: <strong>{skippedCount}</strong></span>
              <span>⏳ Chờ: <strong>{pendingCount}</strong></span>
            </div>
          </div>

          {/* Main action area */}
          {isDone ? null : phase === "delay" ? (
            <DelayCountdown
              onDone={() => onPhaseChange("idle")}
              onPause={() => isPaused ? onResume() : onPause()}
              isPaused={isPaused}
            />
          ) : currentGroup ? (
            <CurrentGroupCard
              group={currentGroup}
              content={content}
              phase={phase}
              absolutePath={absolutePath}
              mediaCount={mediaCount}
              onPhaseChange={onPhaseChange}
              onSuccess={handleSuccess}
              onFail={handleFail}
            />
          ) : null}

          {/* Queue */}
          <PostingQueueList
            groups={groups}
            statusMap={statusMap}
            currentIndex={currentIndex}
            onJumpTo={onJumpTo}
          />

          {/* Keyboard hint */}
          <div className="text-center text-xs text-muted-foreground">
            <span className="bg-muted px-2 py-1 rounded">C</span> Copy &nbsp;
            <span className="bg-muted px-2 py-1 rounded">O</span> Mở group &nbsp;
            <span className="bg-muted px-2 py-1 rounded">Y</span> Đã đăng &nbsp;
            <span className="bg-muted px-2 py-1 rounded">N</span> Không đăng được &nbsp;
            <span className="bg-muted px-2 py-1 rounded">Esc</span> Pause
          </div>

          {/* Completion modal */}
          <CompletionModal
            open={showCompletion}
            contentTitle={content.title}
            groups={groups}
            statusMap={statusMap}
            errorMsgMap={errorMsgMap}
            onReset={onReset}
            onClose={() => setShowCompletion(false)}
          />
        </>
      )}
    </div>
  );
}

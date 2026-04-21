"use client";

import { useEffect, useState } from "react";
import { usePostingSession, type ContentItem, type GroupItem } from "../_hooks/use-posting-session";
import { Step1ContentPicker } from "./step-1-content-picker";
import { Step2GroupPicker } from "./step-2-group-picker";
import { Step3PostingWorkflow } from "./step-3-posting-workflow";

const STEPS = ["① Chọn content", "② Chọn group", "③ Đăng bài"];

function Stepper({ step }: { step: number }) {
  return (
    <div className="flex items-center gap-2">
      {STEPS.map((label, i) => {
        const num = i + 1;
        const active = num === step;
        const done = num < step;
        return (
          <div key={label} className="flex items-center gap-2">
            <div className={`flex items-center gap-1.5 text-sm font-medium ${active ? "text-primary" : done ? "text-green-600" : "text-muted-foreground"}`}>
              <span className={`size-6 rounded-full flex items-center justify-center text-xs font-bold ${
                active ? "bg-primary text-primary-foreground" :
                done ? "bg-green-100 text-green-700" :
                "bg-muted text-muted-foreground"
              }`}>
                {done ? "✓" : num}
              </span>
              <span className="hidden sm:inline">{label}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`h-px w-8 ${done ? "bg-green-400" : "bg-muted"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

export function PostPageClient() {
  const { state, dispatch, saveToStorage, clearStorage, loadFromStorage } = usePostingSession();
  const [resumeBanner, setResumeBanner] = useState<{ contentId: string; groupCount: number } | null>(null);

  // Check localStorage for interrupted session
  useEffect(() => {
    const saved = loadFromStorage();
    if (saved && saved.contentId && saved.groupIds.length > 0) {
      setResumeBanner({ contentId: saved.contentId, groupCount: saved.groupIds.length });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // beforeunload warning during posting
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (state.step === 3 && !state.isDone) {
        e.preventDefault();
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [state.step, state.isDone]);

  async function handleResume() {
    const saved = loadFromStorage();
    if (!saved) return;
    setResumeBanner(null);

    try {
      // Fetch content
      const cRes = await fetch(`/api/content/${saved.contentId}`);
      const cJson = await cRes.json();
      if (!cJson.data) return;
      dispatch({ type: "SELECT_CONTENT", content: cJson.data as ContentItem });

      // Fetch groups
      const gRes = await fetch(`/api/groups?limit=100`);
      const gJson = await gRes.json();
      const allGroups: GroupItem[] = gJson.items ?? [];
      const ordered = saved.groupIds
        .map((id) => allGroups.find((g) => g.id === id))
        .filter(Boolean) as GroupItem[];

      dispatch({ type: "SET_GROUPS", groups: ordered });
      // Restore statusMap
      ordered.forEach((g) => {
        const status = saved.statusMap[g.id] ?? "pending";
        dispatch({ type: "MARK_STATUS", groupId: g.id, status });
      });
      dispatch({ type: "JUMP_TO", index: saved.currentIndex });
      dispatch({ type: "SET_STEP", step: 3 });
    } catch {
      clearStorage();
    }
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">📤 Đăng bài Facebook</h2>
          <p className="text-sm text-muted-foreground">Copy-paste assistant cho HR</p>
        </div>
        <Stepper step={state.step} />
      </div>

      {/* Resume banner */}
      {resumeBanner && (
        <div className="flex items-center justify-between rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm">
          <p className="text-blue-800">
            📋 Có session đăng bài chưa hoàn thành ({resumeBanner.groupCount} group). Tiếp tục?
          </p>
          <div className="flex gap-2 shrink-0">
            <button
              type="button"
              onClick={handleResume}
              className="font-medium text-blue-700 hover:underline"
            >
              Tiếp tục
            </button>
            <span className="text-blue-400">·</span>
            <button
              type="button"
              onClick={() => { clearStorage(); setResumeBanner(null); }}
              className="text-blue-600 hover:underline"
            >
              Bỏ qua
            </button>
          </div>
        </div>
      )}

      {/* Steps */}
      <div style={{ minHeight: "60vh" }}>
        {state.step === 1 && (
          <Step1ContentPicker
            selectedContent={state.selectedContent}
            onSelectContent={(c) => dispatch({ type: "SELECT_CONTENT", content: c })}
            onNext={() => dispatch({ type: "SET_STEP", step: 2 })}
          />
        )}

        {state.step === 2 && state.selectedContent && (
          <Step2GroupPicker
            selectedContent={state.selectedContent}
            selectedGroups={state.selectedGroups}
            onToggleGroup={(g) => dispatch({ type: "TOGGLE_GROUP", group: g })}
            onSetGroups={(groups) => dispatch({ type: "SET_GROUPS", groups })}
            onReorder={(from, to) => dispatch({ type: "REORDER_GROUP", fromIndex: from, toIndex: to })}
            onBack={() => dispatch({ type: "SET_STEP", step: 1 })}
            onNext={() => {
              // Sort by memberCount desc before starting
              const sorted = [...state.selectedGroups].sort((a, b) => (b.memberCount ?? 0) - (a.memberCount ?? 0));
              dispatch({ type: "SET_GROUPS", groups: sorted });
              dispatch({ type: "SET_STEP", step: 3 });
            }}
          />
        )}

        {state.step === 3 && state.selectedContent && (
          <Step3PostingWorkflow
            content={state.selectedContent}
            groups={state.selectedGroups}
            currentIndex={state.currentIndex}
            statusMap={state.statusMap}
            phase={state.phase}
            sessionId={state.sessionId}
            absolutePath={state.absolutePath}
            mediaCount={state.mediaCount}
            isPaused={state.isPaused}
            isDone={state.isDone}
            onPhaseChange={(phase) => dispatch({ type: "SET_PHASE", phase })}
            onMarkStatus={(groupId, status) => dispatch({ type: "MARK_STATUS", groupId, status })}
            onNextGroup={() => dispatch({ type: "NEXT_GROUP" })}
            onJumpTo={(index) => dispatch({ type: "JUMP_TO", index })}
            onPause={() => dispatch({ type: "PAUSE" })}
            onResume={() => dispatch({ type: "RESUME" })}
            onReset={() => { clearStorage(); dispatch({ type: "RESET" }); }}
            onSetSession={(sessionId, absolutePath, mediaCount) =>
              dispatch({ type: "SET_SESSION", sessionId, absolutePath, mediaCount })
            }
            saveToStorage={saveToStorage}
            clearStorage={clearStorage}
          />
        )}
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import type { GroupItem, GroupStatus } from "../_hooks/use-posting-session";

const STATUS_ICON: Record<GroupStatus, string> = {
  pending: "⏳",
  success: "✅",
  failed: "❌",
  skipped: "⏭️",
};

interface Props {
  groups: GroupItem[];
  statusMap: Record<string, GroupStatus>;
  currentIndex: number;
  onJumpTo: (index: number) => void;
}

export function PostingQueueList({ groups, statusMap, currentIndex, onJumpTo }: Props) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="rounded-xl border bg-background">
      <button
        type="button"
        onClick={() => setCollapsed(!collapsed)}
        className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium hover:bg-muted/50"
      >
        <span>📋 Danh sách queue ({groups.length} group)</span>
        {collapsed ? <ChevronDown className="size-4" /> : <ChevronUp className="size-4" />}
      </button>

      {!collapsed && (
        <div className="divide-y max-h-56 overflow-y-auto">
          {groups.map((group, index) => {
            const status = statusMap[group.id] ?? "pending";
            const isCurrent = index === currentIndex;
            const isPending = status === "pending";

            return (
              <div
                key={group.id}
                className={cn(
                  "flex items-center gap-3 px-4 py-2.5",
                  isCurrent && "bg-primary/5",
                  isPending && index > currentIndex && "cursor-pointer hover:bg-muted/50"
                )}
                onClick={() => {
                  if (isPending && index > currentIndex) onJumpTo(index);
                }}
              >
                <span className="text-base w-6 text-center">
                  {isCurrent ? "🔄" : STATUS_ICON[status]}
                </span>
                <div className="flex-1 min-w-0">
                  <p className={cn("text-sm truncate", isCurrent && "font-semibold")}>{group.name}</p>
                </div>
                <span className="text-xs text-muted-foreground">{index + 1}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Search, ExternalLink, ChevronLeft, ChevronRight, ChevronUp, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ContentItem, GroupItem } from "../_hooks/use-posting-session";

const CATEGORY_LABELS: Record<string, string> = {
  IT: "IT", SALES: "Sales", MARKETING: "Marketing", GENERAL: "Chung", OTHER: "Khác",
};

function formatMemberCount(n: number | null): string {
  if (n == null) return "—";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${Math.round(n / 1_000)}K`;
  return String(n);
}

function minutesAgo(dateStr: string | null): number | null {
  if (!dateStr) return null;
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
}

interface Props {
  selectedContent: ContentItem;
  selectedGroups: GroupItem[];
  onToggleGroup: (g: GroupItem) => void;
  onSetGroups: (groups: GroupItem[]) => void;
  onReorder: (from: number, to: number) => void;
  onBack: () => void;
  onNext: () => void;
}

export function Step2GroupPicker({
  selectedContent, selectedGroups, onToggleGroup, onSetGroups, onReorder, onBack, onNext,
}: Props) {
  const [allGroups, setAllGroups] = useState<GroupItem[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [alreadyPosted, setAlreadyPosted] = useState<Set<string>>(new Set());
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchGroups = useCallback(async (q: string, cat: string) => {
    setIsLoading(true);
    try {
      const sp = new URLSearchParams({ status: "active", limit: "100" });
      if (q) sp.set("search", q);
      if (cat) sp.set("category", cat);
      const res = await fetch(`/api/groups?${sp}`);
      const json = await res.json();
      let items: GroupItem[] = json.items ?? [];
      // Auto-sort: cùng category lên đầu
      items = items.sort((a, b) => {
        const aMatch = a.category === selectedContent.position ? 1 : 0;
        const bMatch = b.category === selectedContent.position ? 1 : 0;
        if (bMatch !== aMatch) return bMatch - aMatch;
        return (b.memberCount ?? 0) - (a.memberCount ?? 0);
      });
      setAllGroups(items);
    } catch {
      setAllGroups([]);
    } finally {
      setIsLoading(false);
    }
  }, [selectedContent.position]);

  useEffect(() => {
    fetchGroups("", "");
    fetch(`/api/post-log?contentId=${selectedContent.id}`)
      .then((r) => r.json())
      .then((j) => setAlreadyPosted(new Set(j.fbGroupIds ?? [])))
      .catch(() => {});
  }, [fetchGroups, selectedContent.id]);

  function handleSearch(v: string) {
    setSearch(v);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => fetchGroups(v, category), 300);
  }

  function handleCategory(v: string) {
    setCategory(v);
    fetchGroups(search, v);
  }

  function handleSelectAll() {
    const suitable = allGroups.filter((g) => g.category === selectedContent.position.toUpperCase() || g.category === "GENERAL");
    const current = new Set(selectedGroups.map((g) => g.id));
    const toAdd = suitable.filter((g) => !current.has(g.id));
    const newGroups = [...selectedGroups, ...toAdd].sort((a, b) => (b.memberCount ?? 0) - (a.memberCount ?? 0));
    onSetGroups(newGroups);
  }

  const selectedIds = new Set(selectedGroups.map((g) => g.id));

  return (
    <div className="flex gap-6 h-full">
      {/* Left: Group list */}
      <div className="w-[40%] flex flex-col gap-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Tìm tên group..."
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <select
            value={category}
            onChange={(e) => handleCategory(e.target.value)}
            className="rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="">Tất cả</option>
            {Object.entries(CATEGORY_LABELS).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            Đã chọn: <strong>{selectedGroups.length}</strong> group
          </span>
          <button
            type="button"
            onClick={handleSelectAll}
            className="text-xs text-primary hover:underline"
          >
            Chọn tất cả phù hợp
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-1.5">
          {isLoading ? (
            <div className="text-center py-8 text-sm text-muted-foreground">Đang tải...</div>
          ) : allGroups.length === 0 ? (
            <div className="text-center py-8 text-sm text-muted-foreground">Không tìm thấy group</div>
          ) : (
            allGroups.map((group) => {
              const mins = minutesAgo(group.lastPostedAt);
              const recentlyPosted = mins !== null && mins < 60;
              const posted = alreadyPosted.has(group.id);
              const isSelected = selectedIds.has(group.id);

              return (
                <button
                  key={group.id}
                  type="button"
                  onClick={() => onToggleGroup(group)}
                  className={cn(
                    "w-full text-left rounded-lg border p-2.5 transition-colors hover:bg-accent",
                    isSelected && "border-primary bg-primary/5"
                  )}
                >
                  <div className="flex items-start gap-2">
                    <div className={cn(
                      "mt-0.5 size-4 shrink-0 rounded border-2 flex items-center justify-center",
                      isSelected ? "border-primary bg-primary" : "border-muted-foreground"
                    )}>
                      {isSelected && <span className="text-primary-foreground text-[10px] leading-none">✓</span>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-medium text-sm line-clamp-1">{group.name}</span>
                        <span className="text-xs bg-muted px-1.5 py-0.5 rounded">{CATEGORY_LABELS[group.category] ?? group.category}</span>
                        {group.memberCount != null && (
                          <span className="text-xs text-muted-foreground">{formatMemberCount(group.memberCount)}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        {recentlyPosted && (
                          <span className="text-[11px] bg-red-50 text-red-600 px-1.5 py-0.5 rounded">⚠️ {mins}p trước</span>
                        )}
                        {posted && (
                          <span className="text-[11px] bg-orange-50 text-orange-600 px-1.5 py-0.5 rounded">🔄 Đã đăng content này</span>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Right: Order + recap */}
      <div className="flex-1 flex flex-col gap-4">
        {/* Content summary */}
        <div className="rounded-lg border bg-muted/30 p-3">
          <p className="text-xs text-muted-foreground mb-0.5">Content đã chọn</p>
          <p className="font-semibold text-sm">{selectedContent.title}</p>
          <p className="text-xs text-muted-foreground">{selectedContent.position}</p>
        </div>

        {/* Group order */}
        <div className="flex-1 overflow-y-auto">
          {selectedGroups.length === 0 ? (
            <div className="flex-1 flex items-center justify-center rounded-xl border-2 border-dashed h-32 text-muted-foreground text-sm text-center">
              <div>
                <p>👈 Chọn group từ bên trái</p>
                <p className="text-xs mt-1">Có thể chọn nhiều group</p>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground font-medium">Thứ tự đăng (kéo up/down để sắp xếp)</p>
              {selectedGroups.map((group, index) => (
                <div key={group.id} className="flex items-center gap-2 rounded-lg border bg-background p-2.5">
                  <span className="text-xs text-muted-foreground w-5 text-center font-mono">{index + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{group.name}</p>
                    <p className="text-xs text-muted-foreground">{formatMemberCount(group.memberCount)}</p>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <button
                      type="button"
                      disabled={index === 0}
                      onClick={() => onReorder(index, index - 1)}
                      className="rounded p-0.5 hover:bg-muted disabled:opacity-30"
                    >
                      <ChevronUp className="size-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={index === selectedGroups.length - 1}
                      onClick={() => onReorder(index, index + 1)}
                      className="rounded p-0.5 hover:bg-muted disabled:opacity-30"
                    >
                      <ChevronDown className="size-3.5" />
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => onToggleGroup(group)}
                    className="text-muted-foreground hover:text-destructive text-xs"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-between">
          <Button variant="outline" onClick={onBack} className="gap-2">
            <ChevronLeft className="size-4" />Quay lại
          </Button>
          <Button onClick={onNext} disabled={selectedGroups.length === 0} className="gap-2 px-6">
            Bắt đầu đăng bài
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

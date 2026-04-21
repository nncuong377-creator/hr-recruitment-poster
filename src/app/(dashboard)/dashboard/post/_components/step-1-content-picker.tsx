"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Search, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ContentItem } from "../_hooks/use-posting-session";

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days >= 1) return `${days} ngày trước`;
  const hours = Math.floor(diff / 3600000);
  if (hours >= 1) return `${hours} giờ trước`;
  return `${Math.floor(diff / 60000)} phút trước`;
}

interface Props {
  selectedContent: ContentItem | null;
  onSelectContent: (c: ContentItem) => void;
  onNext: () => void;
}

export function Step1ContentPicker({ selectedContent, onSelectContent, onNext }: Props) {
  const [items, setItems] = useState<ContentItem[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchContent = useCallback(async (q: string) => {
    setIsLoading(true);
    try {
      const sp = new URLSearchParams({ status: "APPROVED", limit: "50" });
      if (q) sp.set("search", q);
      const res = await fetch(`/api/content?${sp}`);
      const json = await res.json();
      setItems(json.items ?? []);
    } catch {
      setItems([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchContent(""); }, [fetchContent]);

  function handleSearch(v: string) {
    setSearch(v);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => fetchContent(v), 300);
  }

  const hashtags = selectedContent?.hashtags?.split(" ").filter(Boolean) ?? [];
  const images = selectedContent?.medias?.filter((m) => m.type === "IMAGE") ?? [];

  return (
    <div className="flex gap-6 h-full">
      {/* Left: Content list */}
      <div className="w-[35%] flex flex-col gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Tìm tiêu đề hoặc vị trí..."
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex-1 overflow-y-auto space-y-2">
          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground text-sm">Đang tải...</div>
          ) : items.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm">
              <p className="text-3xl mb-2">📭</p>
              <p>Không có content đã duyệt</p>
              <p className="text-xs mt-1">Vào Thư viện → duyệt bài trước</p>
            </div>
          ) : (
            items.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectContent(item)}
                className={cn(
                  "w-full text-left rounded-lg border p-3 transition-colors hover:bg-accent",
                  selectedContent?.id === item.id && "border-primary bg-primary/5"
                )}
              >
                <div className="flex items-start gap-2">
                  <div className={cn(
                    "mt-0.5 size-4 shrink-0 rounded-full border-2",
                    selectedContent?.id === item.id ? "border-primary bg-primary" : "border-muted-foreground"
                  )} />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm line-clamp-1">{item.title}</p>
                    <p className="text-xs text-muted-foreground">{item.position}</p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      {item.medias.length > 0 && (
                        <span className="text-xs text-muted-foreground">📎 {item.medias.length}</span>
                      )}
                      {(item._count?.postLogs ?? 0) > 0 && (
                        <span className="text-xs text-muted-foreground">Đã đăng {item._count.postLogs} lần</span>
                      )}
                      <span className="text-xs text-muted-foreground">{relativeTime(item.createdAt)}</span>
                    </div>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Right: Preview */}
      <div className="flex-1 flex flex-col gap-4">
        {!selectedContent ? (
          <div className="flex-1 flex items-center justify-center rounded-xl border-2 border-dashed text-muted-foreground">
            <div className="text-center">
              <p className="text-4xl mb-3">👈</p>
              <p className="font-medium">Chọn content để xem preview</p>
              <p className="text-sm mt-1">Chỉ content đã duyệt mới được đăng</p>
            </div>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto rounded-xl border bg-background p-5 space-y-4">
              <div>
                <h3 className="text-lg font-bold">{selectedContent.title}</h3>
                <p className="text-sm text-muted-foreground">{selectedContent.position}</p>
              </div>
              <p className="text-sm whitespace-pre-wrap leading-relaxed">{selectedContent.description}</p>
              {hashtags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {hashtags.map((tag) => (
                    <span key={tag} className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">{tag}</span>
                  ))}
                </div>
              )}
              {images.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {images.slice(0, 6).map((img) => (
                    <img key={img.id} src={img.url} alt="" className="rounded-lg aspect-square object-cover w-full" />
                  ))}
                </div>
              )}
            </div>
            <div className="flex justify-end">
              <Button onClick={onNext} className="gap-2 px-6">
                Tiếp theo: Chọn group
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

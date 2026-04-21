"use client";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface ContentItem {
  id: string;
  title: string;
  position: string;
  description: string;
  hashtags: string;
  status: "DRAFT" | "APPROVED" | "POSTED" | "ARCHIVED";
  createdAt: string;
  medias: { id: string; url: string; type: string }[];
  author: { name: string };
}

const STATUS_CONFIG = {
  DRAFT:    { label: "Nháp",         className: "bg-gray-100 text-gray-700" },
  APPROVED: { label: "Đã duyệt",     className: "bg-green-100 text-green-700" },
  POSTED:   { label: "Đã đăng",      className: "bg-blue-100 text-blue-700" },
  ARCHIVED: { label: "Đã lưu trữ",   className: "bg-slate-100 text-slate-600" },
};

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days >= 1) return `${days} ngày trước`;
  const hours = Math.floor(diff / 3600000);
  if (hours >= 1) return `${hours} giờ trước`;
  const mins = Math.floor(diff / 60000);
  return mins > 0 ? `${mins} phút trước` : "vừa xong";
}

interface ContentCardProps {
  item: ContentItem;
  onSelect: () => void;
}

export function ContentCard({ item, onSelect }: ContentCardProps) {
  const status = STATUS_CONFIG[item.status] ?? STATUS_CONFIG.DRAFT;
  const firstImage = item.medias.find((m) => m.type === "IMAGE");

  return (
    <Card
      onClick={onSelect}
      className="cursor-pointer overflow-hidden transition-shadow hover:shadow-md"
    >
      {/* Thumbnail */}
      <div className="relative aspect-video bg-muted">
        {firstImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={firstImage.url}
            alt={item.title}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-4xl text-muted-foreground">
            📄
          </div>
        )}
        {/* Status badge */}
        <span
          className={cn(
            "absolute right-2 top-2 rounded-full px-2 py-0.5 text-xs font-medium",
            status.className
          )}
        >
          {status.label}
        </span>
      </div>

      <CardContent className="p-4 space-y-2">
        {/* Title */}
        <h3 className="line-clamp-2 font-semibold leading-snug">{item.title}</h3>
        {/* Position */}
        <p className="text-xs text-muted-foreground">{item.position}</p>
        {/* Body preview */}
        <p className="line-clamp-3 text-sm text-muted-foreground">{item.description}</p>
        {/* Footer */}
        <div className="flex items-center justify-between pt-1 text-xs text-muted-foreground">
          <span>{relativeTime(item.createdAt)}</span>
          {item.medias.length > 0 && <span>📎 {item.medias.length}</span>}
        </div>
      </CardContent>
    </Card>
  );
}

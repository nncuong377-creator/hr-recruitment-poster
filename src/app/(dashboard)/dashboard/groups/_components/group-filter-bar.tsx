"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { X } from "lucide-react";

export const CATEGORY_LABELS: Record<string, string> = {
  IT:        "IT / Lập trình",
  SALES:     "Kinh doanh / Sales",
  MARKETING: "Marketing",
  GENERAL:   "Hành chính / HR / Vận hành",
  OTHER:     "Khác",
};

interface GroupFilterBarProps {
  search: string;
  category: string;
  status: string;
  onSearchChange: (v: string) => void;
  onCategoryChange: (v: string) => void;
  onStatusChange: (v: string) => void;
  onClearFilters: () => void;
  hasActiveFilters: boolean;
}

export function GroupFilterBar({
  search, category, status,
  onSearchChange, onCategoryChange, onStatusChange,
  onClearFilters, hasActiveFilters,
}: GroupFilterBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-lg bg-muted/30 px-4 py-3">
      <Input
        placeholder="Tìm theo tên hoặc URL..."
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        className="w-64 bg-background"
      />

      <Select value={category || "__all__"} onValueChange={(v) => onCategoryChange(v === "__all__" ? "" : v)}>
        <SelectTrigger className="w-52 bg-background">
          <SelectValue placeholder="Tất cả lĩnh vực" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__all__">Tất cả lĩnh vực</SelectItem>
          {Object.entries(CATEGORY_LABELS).map(([val, label]) => (
            <SelectItem key={val} value={val}>{label}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={status || "__all__"} onValueChange={(v) => onStatusChange(v === "__all__" ? "" : v)}>
        <SelectTrigger className="w-44 bg-background">
          <SelectValue placeholder="Tất cả trạng thái" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__all__">Tất cả trạng thái</SelectItem>
          <SelectItem value="active">Đang active</SelectItem>
          <SelectItem value="inactive">Không active</SelectItem>
        </SelectContent>
      </Select>

      {hasActiveFilters && (
        <Button variant="ghost" size="sm" onClick={onClearFilters} className="gap-1.5 text-muted-foreground">
          <X className="size-3.5" />
          Xoá filter
        </Button>
      )}
    </div>
  );
}

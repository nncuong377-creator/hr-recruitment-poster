"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { X } from "lucide-react";

interface ContentFilterBarProps {
  search: string;
  status: string;
  sort: string;
  onSearchChange: (v: string) => void;
  onStatusChange: (v: string) => void;
  onSortChange: (v: string) => void;
  onClearFilters: () => void;
  hasActiveFilters: boolean;
}

export function ContentFilterBar({
  search, status, sort,
  onSearchChange, onStatusChange, onSortChange,
  onClearFilters, hasActiveFilters,
}: ContentFilterBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-lg bg-muted/30 px-4 py-3 sticky top-0 z-10">
      <Input
        placeholder="Tìm theo tiêu đề hoặc vị trí..."
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        className="w-64 bg-background"
      />

      <Select value={status || "__all__"} onValueChange={(v) => onStatusChange(v === "__all__" ? "" : v)}>
        <SelectTrigger className="w-44 bg-background">
          <SelectValue placeholder="Tất cả trạng thái" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__all__">Tất cả trạng thái</SelectItem>
          <SelectItem value="DRAFT">Nháp</SelectItem>
          <SelectItem value="APPROVED">Đã duyệt</SelectItem>
          <SelectItem value="POSTED">Đã đăng</SelectItem>
          <SelectItem value="ARCHIVED">Đã lưu trữ</SelectItem>
        </SelectContent>
      </Select>

      <Select value={sort} onValueChange={onSortChange}>
        <SelectTrigger className="w-36 bg-background">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="newest">Mới nhất</SelectItem>
          <SelectItem value="oldest">Cũ nhất</SelectItem>
          <SelectItem value="alphabetical">A-Z</SelectItem>
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

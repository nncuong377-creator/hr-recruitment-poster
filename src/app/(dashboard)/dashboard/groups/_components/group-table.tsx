"use client";

import { useState } from "react";
import { toast } from "sonner";
import { ExternalLink, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { Switch as SwitchPrimitive, DropdownMenu } from "radix-ui";
import { cn } from "@/lib/utils";
import { CATEGORY_LABELS } from "./group-filter-bar";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface FbGroupItem {
  id: string;
  name: string;
  url: string;
  category: string;
  memberCount: number | null;
  notes: string;
  lastPostedAt: string | null;
  isActive: boolean;
  createdAt: string;
  _count: { postLogs: number };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatMemberCount(n: number | null): string {
  if (n == null) return "—";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${Math.round(n / 1_000)}K`;
  return String(n);
}

function relativeTime(dateStr: string | null): string {
  if (!dateStr) return "Chưa đăng";
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days >= 1) return `${days} ngày trước`;
  const hours = Math.floor(diff / 3600000);
  if (hours >= 1) return `${hours} giờ trước`;
  const mins = Math.floor(diff / 60000);
  return mins > 0 ? `${mins} phút trước` : "vừa xong";
}

function wasRecentlyPosted(dateStr: string | null): boolean {
  if (!dateStr) return false;
  return Date.now() - new Date(dateStr).getTime() < 3600000; // < 1 giờ
}

// ─── Switch component ─────────────────────────────────────────────────────────

function Switch({ checked, onCheckedChange, disabled }: {
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <SwitchPrimitive.Root
      checked={checked}
      onCheckedChange={onCheckedChange}
      disabled={disabled}
      className={cn(
        "relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        "disabled:cursor-not-allowed disabled:opacity-50",
        checked ? "bg-primary" : "bg-input"
      )}
    >
      <SwitchPrimitive.Thumb
        className={cn(
          "pointer-events-none block h-4 w-4 rounded-full bg-background shadow-lg ring-0 transition-transform",
          checked ? "translate-x-4" : "translate-x-0"
        )}
      />
    </SwitchPrimitive.Root>
  );
}

// ─── Actions dropdown ─────────────────────────────────────────────────────────

function ActionsDropdown({ onEdit, onDelete }: {
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          className="rounded p-1 hover:bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <MoreHorizontal className="size-4" />
          <span className="sr-only">Actions</span>
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={4}
          className="z-50 min-w-32 overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95"
        >
          <DropdownMenu.Item
            onSelect={onEdit}
            className="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground"
          >
            <Pencil className="size-3.5" />
            Sửa
          </DropdownMenu.Item>
          <DropdownMenu.Separator className="my-1 h-px bg-muted" />
          <DropdownMenu.Item
            onSelect={onDelete}
            className="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-destructive outline-none hover:bg-destructive/10"
          >
            <Trash2 className="size-3.5" />
            Xoá
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

// ─── Main Table ───────────────────────────────────────────────────────────────

interface GroupTableProps {
  items: FbGroupItem[];
  onEdit: (group: FbGroupItem) => void;
  onDelete: (group: FbGroupItem) => void;
  onRefresh: () => void;
}

export function GroupTable({ items, onEdit, onDelete, onRefresh }: GroupTableProps) {
  const [togglingId, setTogglingId] = useState<string | null>(null);

  async function handleToggleActive(group: FbGroupItem) {
    setTogglingId(group.id);
    try {
      const res = await fetch(`/api/groups/${group.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !group.isActive }),
      });
      if (!res.ok) throw new Error("Cập nhật thất bại");
      toast.success(group.isActive ? "Đã tạm ẩn group" : "Đã kích hoạt group");
      onRefresh();
    } catch {
      toast.error("Không cập nhật được trạng thái");
    } finally {
      setTogglingId(null);
    }
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center py-20 text-center text-muted-foreground">
        <p className="text-4xl mb-3">📭</p>
        <p className="font-medium">Chưa có group nào</p>
        <p className="text-sm">Thêm group đầu tiên bằng nút &ldquo;+ Thêm group&rdquo;</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/50 text-left text-xs font-medium text-muted-foreground">
            <th className="px-4 py-3">Tên group</th>
            <th className="px-4 py-3">Lĩnh vực</th>
            <th className="px-4 py-3 text-right">Thành viên</th>
            <th className="px-4 py-3">Trạng thái</th>
            <th className="px-4 py-3">Lần đăng cuối</th>
            <th className="px-4 py-3 max-w-[180px]">Ghi chú</th>
            <th className="px-4 py-3 w-12"></th>
          </tr>
        </thead>
        <tbody>
          {items.map((group) => {
            const recent = wasRecentlyPosted(group.lastPostedAt);
            return (
              <tr
                key={group.id}
                className={cn(
                  "border-b last:border-0 transition-colors",
                  recent ? "bg-amber-50/60 hover:bg-amber-50" : "hover:bg-muted/30",
                  !group.isActive && "opacity-60"
                )}
              >
                {/* Tên + URL */}
                <td className="px-4 py-3">
                  <div className="font-medium leading-snug">{group.name}</div>
                  <a
                    href={group.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center gap-0.5 text-xs text-blue-600 hover:underline"
                  >
                    <span className="truncate max-w-[200px]">{group.url.replace("https://facebook.com/groups/", "")}</span>
                    <ExternalLink className="size-3 shrink-0" />
                  </a>
                  {recent && (
                    <span className="mt-1 inline-block rounded bg-amber-100 px-1.5 py-0.5 text-[10px] text-amber-800">
                      ⚠️ Vừa đăng — nên chờ trước khi đăng lại
                    </span>
                  )}
                </td>

                {/* Category */}
                <td className="px-4 py-3">
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                    {CATEGORY_LABELS[group.category] ?? group.category}
                  </span>
                </td>

                {/* Member count */}
                <td className="px-4 py-3 text-right tabular-nums">
                  {formatMemberCount(group.memberCount)}
                </td>

                {/* Toggle isActive */}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={group.isActive}
                      onCheckedChange={() => handleToggleActive(group)}
                      disabled={togglingId === group.id}
                    />
                    <span className="text-xs text-muted-foreground">
                      {group.isActive ? "Active" : "Ẩn"}
                    </span>
                  </div>
                </td>

                {/* Last posted */}
                <td className="px-4 py-3 text-muted-foreground">
                  {relativeTime(group.lastPostedAt)}
                </td>

                {/* Notes */}
                <td className="px-4 py-3 max-w-[180px]">
                  {group.notes ? (
                    <span
                      className="block truncate text-muted-foreground"
                      title={group.notes}
                    >
                      {group.notes}
                    </span>
                  ) : (
                    <span className="text-muted-foreground/40">—</span>
                  )}
                </td>

                {/* Actions */}
                <td className="px-4 py-3">
                  <ActionsDropdown
                    onEdit={() => onEdit(group)}
                    onDelete={() => onDelete(group)}
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

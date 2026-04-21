"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { CATEGORY_LABELS } from "./group-filter-bar";
import type { FbGroupItem } from "./group-table";

interface GroupFormDialogProps {
  open: boolean;
  mode: "create" | "edit";
  group?: FbGroupItem | null;
  onClose: () => void;
  onSaved: () => void;
}

const EMPTY_FORM = {
  name: "", url: "", category: "", memberCount: "", notes: "", isActive: true,
};

export function GroupFormDialog({ open, mode, group, onClose, onSaved }: GroupFormDialogProps) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);

  // Reset form khi mở dialog
  useEffect(() => {
    if (!open) return;
    if (mode === "edit" && group) {
      setForm({
        name: group.name,
        url: group.url,
        category: group.category,
        memberCount: group.memberCount != null ? String(group.memberCount) : "",
        notes: group.notes ?? "",
        isActive: group.isActive,
      });
    } else {
      setForm(EMPTY_FORM);
    }
    setErrors({});
    // Auto-focus tên
    setTimeout(() => nameRef.current?.focus(), 50);
  }, [open, mode, group]);

  function set(field: string, value: string | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => { const e = { ...prev }; delete e[field]; return e; });
  }

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Tên group là bắt buộc";
    if (!form.url.trim()) e.url = "URL là bắt buộc";
    else if (!/^https?:\/\/(www\.)?facebook\.com\/groups\//.test(form.url.trim())) {
      e.url = "URL phải bắt đầu với https://facebook.com/groups/";
    }
    if (!form.category) e.category = "Vui lòng chọn lĩnh vực";
    if (form.memberCount && isNaN(parseInt(form.memberCount))) e.memberCount = "Số thành viên phải là số";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;
    setIsSaving(true);
    try {
      const body = {
        name: form.name.trim(),
        url: form.url.trim(),
        category: form.category,
        memberCount: form.memberCount ? parseInt(form.memberCount) : null,
        notes: form.notes.trim(),
        isActive: form.isActive,
      };

      const url = mode === "edit" ? `/api/groups/${group!.id}` : "/api/groups";
      const method = mode === "edit" ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();

      if (!res.ok) {
        if (res.status === 409 && json.field === "url") {
          setErrors({ url: "URL group này đã tồn tại trong hệ thống" });
          return;
        }
        throw new Error(json.error ?? "Lưu thất bại");
      }

      toast.success(mode === "edit" ? "Đã cập nhật group" : "Đã thêm group mới");
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Lưu thất bại");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{mode === "edit" ? "Sửa thông tin group" : "Thêm Facebook Group"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Tên group */}
          <div className="space-y-1.5">
            <Label htmlFor="g-name">Tên group <span className="text-destructive">*</span></Label>
            <Input
              id="g-name"
              ref={nameRef}
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="VD: Việc làm IT Hà Nội"
              className={errors.name ? "border-destructive" : ""}
            />
            {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
          </div>

          {/* URL */}
          <div className="space-y-1.5">
            <Label htmlFor="g-url">URL group <span className="text-destructive">*</span></Label>
            <Input
              id="g-url"
              value={form.url}
              onChange={(e) => set("url", e.target.value)}
              placeholder="https://facebook.com/groups/..."
              className={errors.url ? "border-destructive" : ""}
            />
            {errors.url && <p className="text-xs text-destructive">{errors.url}</p>}
          </div>

          {/* Lĩnh vực */}
          <div className="space-y-1.5">
            <Label>Lĩnh vực <span className="text-destructive">*</span></Label>
            <Select value={form.category} onValueChange={(v) => set("category", v)}>
              <SelectTrigger className={errors.category ? "border-destructive" : ""}>
                <SelectValue placeholder="Chọn lĩnh vực..." />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(CATEGORY_LABELS).map(([val, label]) => (
                  <SelectItem key={val} value={val}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.category && <p className="text-xs text-destructive">{errors.category}</p>}
          </div>

          {/* Member count */}
          <div className="space-y-1.5">
            <Label htmlFor="g-members">Số thành viên (ước lượng)</Label>
            <Input
              id="g-members"
              type="number"
              min={0}
              value={form.memberCount}
              onChange={(e) => set("memberCount", e.target.value)}
              placeholder="VD: 150000"
              className={errors.memberCount ? "border-destructive" : ""}
            />
            <p className="text-xs text-muted-foreground">Ước lượng — giúp ưu tiên group lớn trước</p>
            {errors.memberCount && <p className="text-xs text-destructive">{errors.memberCount}</p>}
          </div>

          {/* Ghi chú */}
          <div className="space-y-1.5">
            <Label htmlFor="g-notes">Ghi chú</Label>
            <Textarea
              id="g-notes"
              rows={3}
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              placeholder="VD: Cần admin approve, nên post sáng thứ 2-6"
            />
          </div>

          {/* isActive toggle */}
          <div className="flex items-center gap-3">
            <input
              id="g-active"
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => set("isActive", e.target.checked)}
              className="size-4 accent-primary"
            />
            <Label htmlFor="g-active" className="cursor-pointer">Đang active (sẽ hiện trong danh sách đăng bài)</Label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSaving}>Huỷ</Button>
          <Button onClick={handleSubmit} disabled={isSaving} className="gap-2">
            {isSaving && <Loader2 className="size-4 animate-spin" />}
            Lưu
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

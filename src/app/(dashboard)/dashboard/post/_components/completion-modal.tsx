"use client";

import { useRouter } from "next/navigation";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { GroupItem, GroupStatus } from "../_hooks/use-posting-session";

interface FailEntry {
  name: string;
  reason: string;
}

interface Props {
  open: boolean;
  contentTitle: string;
  groups: GroupItem[];
  statusMap: Record<string, GroupStatus>;
  errorMsgMap: Record<string, string>;
  onReset: () => void;
  onClose: () => void;
}

export function CompletionModal({ open, contentTitle, groups, statusMap, errorMsgMap, onReset, onClose }: Props) {
  const router = useRouter();
  const success = groups.filter((g) => statusMap[g.id] === "success").length;
  const failed = groups.filter((g) => statusMap[g.id] === "failed");
  const skipped = groups.filter((g) => statusMap[g.id] === "skipped").length;

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {success === groups.length ? "🎉" : "📊"} Hoàn thành!
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Đã đăng <strong className="text-foreground">{contentTitle}</strong> vào{" "}
            <strong className="text-foreground">{success}/{groups.length}</strong> group
          </p>

          <div className="grid grid-cols-3 gap-3">
            {[
              { icon: "✅", label: "Thành công", value: success, color: "text-green-600" },
              { icon: "❌", label: "Thất bại", value: failed.length, color: "text-red-600" },
              { icon: "⏭️", label: "Bỏ qua", value: skipped, color: "text-muted-foreground" },
            ].map(({ icon, label, value, color }) => (
              <div key={label} className="rounded-lg border p-3 text-center">
                <p className="text-xl">{icon}</p>
                <p className={`text-2xl font-bold ${color}`}>{value}</p>
                <p className="text-xs text-muted-foreground">{label}</p>
              </div>
            ))}
          </div>

          {failed.length > 0 && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-3 space-y-1.5">
              <p className="text-xs font-semibold text-red-700">Lý do thất bại:</p>
              {failed.map((g) => (
                <div key={g.id} className="text-xs text-red-600">
                  <span className="font-medium">{g.name}</span>: {errorMsgMap[g.id] ?? "Không rõ"}
                </div>
              ))}
            </div>
          )}
        </div>

        <DialogFooter className="flex gap-2 sm:flex-row flex-col">
          <Button variant="outline" onClick={() => { onClose(); router.push("/dashboard/history"); }}>
            Xem lịch sử
          </Button>
          <Button onClick={() => { onReset(); onClose(); }}>
            Đăng content khác
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

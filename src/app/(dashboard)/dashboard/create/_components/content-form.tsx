"use client";

import { Control, Controller, FieldErrors, UseFormRegister } from "react-hook-form";
import { Loader2, Sparkles, PenLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { FormValues } from "../page";

const CATEGORY_OPTIONS = [
  { label: "IT / Lập trình", value: "IT" },
  { label: "Kinh doanh / Sales", value: "SALES" },
  { label: "Marketing / Truyền thông", value: "MARKETING" },
  { label: "Hành chính / HR / Kế toán", value: "GENERAL" },
  { label: "Khác", value: "OTHER" },
];

const TONE_OPTIONS = [
  {
    value: "professional",
    label: "Chuyên nghiệp",
    desc: "Nghiêm túc, phù hợp vị trí cấp cao",
  },
  {
    value: "friendly",
    label: "Thân thiện",
    desc: "Gần gũi, phù hợp vị trí junior/entry",
  },
  {
    value: "energetic",
    label: "Năng động",
    desc: "Sôi nổi, phù hợp Sales/Marketing",
  },
];

interface ContentFormProps {
  register: UseFormRegister<FormValues>;
  control: Control<FormValues>;
  errors: FieldErrors<FormValues>;
  isGenerating: boolean;
  canGenerate: boolean;
  onGenerate: () => void;
  onSelfWrite: () => void;
}

export function ContentForm({
  register,
  control,
  errors,
  isGenerating,
  canGenerate,
  onGenerate,
  onSelfWrite,
}: ContentFormProps) {
  return (
    <Card className="h-fit">
      <CardHeader>
        <CardTitle className="text-base">Thông tin tuyển dụng</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Vị trí tuyển dụng */}
        <div className="space-y-1.5">
          <Label htmlFor="jobTitle">
            Vị trí tuyển dụng <span className="text-destructive">*</span>
          </Label>
          <Input
            id="jobTitle"
            placeholder="VD: Backend Developer (Node.js)"
            {...register("jobTitle", { required: true })}
            className={cn(errors.jobTitle && "border-destructive")}
          />
          {errors.jobTitle && (
            <p className="text-xs text-destructive">Vui lòng nhập vị trí tuyển dụng</p>
          )}
        </div>

        {/* Lĩnh vực */}
        <div className="space-y-1.5">
          <Label>
            Lĩnh vực <span className="text-destructive">*</span>
          </Label>
          <Controller
            name="category"
            control={control}
            rules={{ required: true }}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger className={cn(errors.category && "border-destructive")}>
                  <SelectValue placeholder="Chọn lĩnh vực..." />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORY_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.category && (
            <p className="text-xs text-destructive">Vui lòng chọn lĩnh vực</p>
          )}
        </div>

        {/* Yêu cầu công việc */}
        <div className="space-y-1.5">
          <Label htmlFor="requirements">Yêu cầu công việc</Label>
          <Textarea
            id="requirements"
            rows={4}
            placeholder="VD: 3+ năm kinh nghiệm Node.js, biết TypeScript, RESTful API..."
            {...register("requirements")}
          />
        </div>

        {/* Quyền lợi */}
        <div className="space-y-1.5">
          <Label htmlFor="benefits">Quyền lợi</Label>
          <Textarea
            id="benefits"
            rows={3}
            placeholder="VD: Lương 20-35 triệu, thưởng dự án, WFH 2 ngày/tuần..."
            {...register("benefits")}
          />
        </div>

        {/* Tone viết */}
        <div className="space-y-2">
          <Label>Tone viết</Label>
          <Controller
            name="tone"
            control={control}
            render={({ field }) => (
              <div className="grid gap-2">
                {TONE_OPTIONS.map((opt) => (
                  <label
                    key={opt.value}
                    className={cn(
                      "flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors",
                      field.value === opt.value
                        ? "border-primary bg-primary/5"
                        : "hover:border-primary/40 hover:bg-muted/30"
                    )}
                  >
                    <input
                      type="radio"
                      value={opt.value}
                      checked={field.value === opt.value}
                      onChange={() => field.onChange(opt.value)}
                      className="mt-0.5 accent-primary"
                    />
                    <div>
                      <p className="text-sm font-medium">{opt.label}</p>
                      <p className="text-xs text-muted-foreground">{opt.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            )}
          />
        </div>

        {/* Thông tin liên hệ */}
        <div className="space-y-1.5">
          <Label htmlFor="contactInfo">Thông tin liên hệ / Ứng tuyển</Label>
          <Textarea
            id="contactInfo"
            rows={2}
            placeholder="VD: Gửi CV về hr@company.com | Hotline: 0901 234 567"
            {...register("contactInfo")}
          />
          <p className="text-xs text-muted-foreground">
            Bỏ trống nếu chưa có — AI sẽ cảnh báo khi lưu
          </p>
        </div>

        {/* Buttons */}
        <div className="space-y-2 pt-1">
          <Button
            type="button"
            className="w-full"
            disabled={!canGenerate || isGenerating}
            onClick={onGenerate}
          >
            {isGenerating ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Đang tạo... (có thể mất 10-20 giây)
              </>
            ) : (
              <>
                <Sparkles className="size-4" />
                Tạo nội dung bằng AI
              </>
            )}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={onSelfWrite}
            disabled={isGenerating}
          >
            <PenLine className="size-4" />
            Tự viết thủ công
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

"use client";

import { RotateCcw, Save, CheckCircle, Loader2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { HashtagEditor } from "./hashtag-editor";
import { MediaUploader, MediaItem } from "./media-uploader";
import { cn } from "@/lib/utils";

interface ContentPreviewProps {
  title: string;
  setTitle: (v: string) => void;
  body: string;
  setBody: (v: string) => void;
  hashtags: string[];
  setHashtags: (v: string[]) => void;
  warnings: string[];
  missingFields: string[];
  mediaFiles: MediaItem[];
  setMediaFiles: (files: MediaItem[]) => void;
  isGenerating: boolean;
  isSaving: boolean;
  onRegenerate: () => void;
  onSave: (status: "DRAFT" | "APPROVED") => void;
}

export function ContentPreview({
  title, setTitle,
  body, setBody,
  hashtags, setHashtags,
  warnings, missingFields,
  mediaFiles, setMediaFiles,
  isGenerating, isSaving,
  onRegenerate, onSave,
}: ContentPreviewProps) {
  const charCount = body.length;
  const isOverLimit = charCount > 2000;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Preview & Chỉnh sửa</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Cảnh báo AI */}
        {warnings.length > 0 && (
          <Alert className="border-amber-300 bg-amber-50 text-amber-900">
            <AlertTriangle className="size-4 text-amber-600" />
            <AlertTitle className="text-amber-800">AI phát hiện thiếu thông tin</AlertTitle>
            <AlertDescription className="mt-1 space-y-1">
              {warnings.map((w, i) => (
                <p key={i} className="text-sm">• {w}</p>
              ))}
            </AlertDescription>
          </Alert>
        )}

        {/* Tiêu đề nội bộ */}
        <div className="space-y-1.5">
          <Label htmlFor="edit-title">Tiêu đề nội bộ</Label>
          <Input
            id="edit-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="VD: Backend Node.js - tháng 4"
          />
          <p className="text-xs text-muted-foreground">Chỉ HR thấy, giúp tìm lại bài dễ hơn</p>
        </div>

        {/* Nội dung bài đăng */}
        <div className="space-y-1.5">
          <Label htmlFor="edit-body">Nội dung bài đăng</Label>
          {isGenerating ? (
            <div className="flex h-64 items-center justify-center rounded-md border bg-muted/30">
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <Loader2 className="size-6 animate-spin" />
                <p className="text-sm">Đang tạo nội dung...</p>
              </div>
            </div>
          ) : (
            <Textarea
              id="edit-body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={18}
              className="font-mono text-sm"
              placeholder="Nội dung bài đăng sẽ xuất hiện ở đây sau khi AI tạo xong..."
            />
          )}
          <p className={cn("text-xs", isOverLimit ? "text-destructive" : "text-muted-foreground")}>
            {charCount} ký tự{isOverLimit ? " — Bài quá dài, FB có thể cắt bớt" : " — phù hợp đăng FB"}
          </p>
        </div>

        {/* Hashtag */}
        <div className="space-y-1.5">
          <Label>Hashtag</Label>
          <HashtagEditor hashtags={hashtags} onChange={setHashtags} />
          <p className="text-xs text-muted-foreground">Gõ hashtag + Enter để thêm, nhấn × để xóa</p>
        </div>

        <Separator />

        {/* Media upload */}
        <MediaUploader files={mediaFiles} onFilesChange={setMediaFiles} />

        <Separator />

        {/* Action buttons */}
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onRegenerate}
            disabled={isGenerating || isSaving}
            className="gap-2"
          >
            <RotateCcw className="size-4" />
            Tạo lại với AI
          </Button>
          <div className="ml-auto flex gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => onSave("DRAFT")}
              disabled={isSaving || isGenerating || !title || !body}
            >
              {isSaving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
              Lưu nháp
            </Button>
            <Button
              type="button"
              onClick={() => onSave("APPROVED")}
              disabled={isSaving || isGenerating || !title || !body}
            >
              {isSaving ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle className="size-4" />}
              Lưu & duyệt
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

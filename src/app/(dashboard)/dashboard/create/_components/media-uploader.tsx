"use client";

import { useRef, useState, DragEvent } from "react";
import { Paperclip, X, ChevronUp, ChevronDown, ImageIcon, Film, ChevronDown as CollapseIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface MediaItem {
  id: string;
  file: File;
  preview: string;
}

interface MediaUploaderProps {
  files: MediaItem[];
  onFilesChange: (files: MediaItem[]) => void;
}

const ACCEPT = "image/jpeg,image/png,image/webp,video/mp4";
const MAX_FILE_MB = 10;
const MAX_TOTAL_MB = 50;

function fileId() {
  return Math.random().toString(36).slice(2);
}

export function MediaUploader({ files, onFilesChange }: MediaUploaderProps) {
  const [open, setOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  function validateAndAdd(incoming: File[]) {
    setError("");
    const totalBefore = files.reduce((s, f) => s + f.file.size, 0);
    const newItems: MediaItem[] = [];
    let totalNew = 0;

    for (const file of incoming) {
      if (file.size > MAX_FILE_MB * 1024 * 1024) {
        setError(`"${file.name}" vượt quá ${MAX_FILE_MB}MB, bỏ qua.`);
        continue;
      }
      totalNew += file.size;
      if (totalBefore + totalNew > MAX_TOTAL_MB * 1024 * 1024) {
        setError("Tổng file vượt quá 50MB, dừng thêm.");
        break;
      }
      const preview = file.type.startsWith("image/") ? URL.createObjectURL(file) : "";
      newItems.push({ id: fileId(), file, preview });
    }

    onFilesChange([...files, ...newItems]);
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(false);
    validateAndAdd(Array.from(e.dataTransfer.files));
  }

  function handleInput(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) {
      validateAndAdd(Array.from(e.target.files));
      e.target.value = "";
    }
  }

  function removeFile(id: string) {
    const item = files.find((f) => f.id === id);
    if (item?.preview) URL.revokeObjectURL(item.preview);
    onFilesChange(files.filter((f) => f.id !== id));
  }

  function moveUp(index: number) {
    if (index === 0) return;
    const next = [...files];
    [next[index - 1], next[index]] = [next[index], next[index - 1]];
    onFilesChange(next);
  }

  function moveDown(index: number) {
    if (index === files.length - 1) return;
    const next = [...files];
    [next[index], next[index + 1]] = [next[index + 1], next[index]];
    onFilesChange(next);
  }

  return (
    <div className="rounded-lg border">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium hover:bg-muted/50"
      >
        <span className="flex items-center gap-2">
          <Paperclip className="size-4" />
          📎 Đính kèm ảnh/video (tùy chọn)
          {files.length > 0 && (
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
              {files.length} file
            </span>
          )}
        </span>
        <CollapseIcon className={cn("size-4 transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="space-y-3 px-4 pb-4">
          {/* Drop zone */}
          <div
            onDrop={handleDrop}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onClick={() => inputRef.current?.click()}
            className={cn(
              "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed py-8 text-sm text-muted-foreground transition-colors",
              isDragging ? "border-primary bg-primary/5" : "hover:border-primary/50 hover:bg-muted/30"
            )}
          >
            <Paperclip className="size-6" />
            <p>Kéo thả file vào đây hoặc <span className="text-primary underline">chọn file</span></p>
            <p className="text-xs">JPG, PNG, WEBP, MP4 — tối đa {MAX_FILE_MB}MB/file, tổng {MAX_TOTAL_MB}MB</p>
          </div>

          <input ref={inputRef} type="file" accept={ACCEPT} multiple className="hidden" onChange={handleInput} />

          {error && <p className="text-xs text-destructive">{error}</p>}

          {/* Thumbnail grid */}
          {files.length > 0 && (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {files.map((item, index) => (
                <div key={item.id} className="group relative rounded-lg border bg-muted/30 overflow-hidden">
                  {item.file.type.startsWith("image/") ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.preview} alt={item.file.name} className="aspect-square w-full object-cover" />
                  ) : (
                    <div className="flex aspect-square items-center justify-center">
                      <Film className="size-8 text-muted-foreground" />
                    </div>
                  )}
                  <p className="truncate px-1 py-0.5 text-[10px] text-muted-foreground">{item.file.name}</p>

                  {/* Controls */}
                  <div className="absolute right-1 top-1 flex flex-col gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                    <button
                      type="button"
                      onClick={() => removeFile(item.id)}
                      className="rounded-full bg-destructive p-0.5 text-white"
                    >
                      <X className="size-3" />
                    </button>
                  </div>
                  <div className="absolute bottom-6 right-1 flex flex-col gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                    <button type="button" onClick={() => moveUp(index)} disabled={index === 0}
                      className="rounded bg-black/40 p-0.5 text-white disabled:opacity-30">
                      <ChevronUp className="size-3" />
                    </button>
                    <button type="button" onClick={() => moveDown(index)} disabled={index === files.length - 1}
                      className="rounded bg-black/40 p-0.5 text-white disabled:opacity-30">
                      <ChevronDown className="size-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

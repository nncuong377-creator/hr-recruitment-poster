"use client";

import { useState, KeyboardEvent } from "react";
import { X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface HashtagEditorProps {
  hashtags: string[];
  onChange: (tags: string[]) => void;
  className?: string;
}

export function HashtagEditor({ hashtags, onChange, className }: HashtagEditorProps) {
  const [inputValue, setInputValue] = useState("");

  function addTag(raw: string) {
    const tag = raw.trim().replace(/^#+/, "");
    if (!tag) return;
    const formatted = `#${tag}`;
    if (hashtags.includes(formatted)) return;
    onChange([...hashtags, formatted]);
    setInputValue("");
  }

  function removeTag(tag: string) {
    onChange(hashtags.filter((t) => t !== tag));
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      addTag(inputValue);
    } else if (e.key === "Backspace" && !inputValue && hashtags.length > 0) {
      removeTag(hashtags[hashtags.length - 1]);
    }
  }

  return (
    <div
      className={cn(
        "flex min-h-10 flex-wrap gap-1.5 rounded-md border bg-background px-3 py-2 focus-within:ring-2 focus-within:ring-ring/50",
        className
      )}
    >
      {hashtags.map((tag) => (
        <span
          key={tag}
          className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary"
        >
          {tag}
          <button
            type="button"
            onClick={() => removeTag(tag)}
            className="rounded-full hover:text-destructive focus:outline-none"
          >
            <X className="size-3" />
          </button>
        </span>
      ))}
      <input
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={hashtags.length === 0 ? "Gõ hashtag + Enter để thêm..." : ""}
        className="min-w-24 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
      />
    </div>
  );
}

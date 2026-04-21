"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

interface Props {
  onDone: () => void;
  onPause: () => void;
  isPaused: boolean;
}

export function DelayCountdown({ onDone, onPause, isPaused }: Props) {
  const [seconds, setSeconds] = useState(() => Math.floor(Math.random() * 61) + 30);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (isPaused) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    intervalRef.current = setInterval(() => {
      setSeconds((s) => {
        if (s <= 1) {
          clearInterval(intervalRef.current!);
          onDone();
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isPaused, onDone]);

  return (
    <div className="rounded-xl border bg-amber-50 border-amber-200 p-6 text-center space-y-4">
      <p className="text-2xl font-bold text-amber-700">⏰ {seconds}s</p>
      <p className="text-sm text-amber-600">
        {isPaused ? "⏸️ Đang tạm dừng..." : "Đợi trước khi đăng group tiếp theo (tránh bị FB phát hiện)"}
      </p>
      <div className="flex justify-center gap-3">
        <Button size="sm" variant="outline" onClick={() => onDone()} className="gap-1">
          ⏭️ Bỏ qua delay
        </Button>
        <Button size="sm" variant="outline" onClick={onPause} className="gap-1">
          {isPaused ? "▶️ Tiếp tục" : "⏸️ Tạm dừng"}
        </Button>
      </div>
      <p className="text-[11px] text-muted-foreground">Space = bỏ qua • Esc = tạm dừng</p>
    </div>
  );
}

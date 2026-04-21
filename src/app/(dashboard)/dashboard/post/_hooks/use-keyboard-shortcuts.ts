"use client";

import { useEffect } from "react";

interface ShortcutHandlers {
  onCopy?: () => void;
  onOpen?: () => void;
  onSuccess?: () => void;
  onFail?: () => void;
  onSkipDelay?: () => void;
  onPause?: () => void;
  active: boolean;
}

export function useKeyboardShortcuts({
  onCopy,
  onOpen,
  onSuccess,
  onFail,
  onSkipDelay,
  onPause,
  active,
}: ShortcutHandlers) {
  useEffect(() => {
    if (!active) return;

    function handleKey(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      switch (e.key.toLowerCase()) {
        case "c": e.preventDefault(); onCopy?.(); break;
        case "o": e.preventDefault(); onOpen?.(); break;
        case "y": e.preventDefault(); onSuccess?.(); break;
        case "n": e.preventDefault(); onFail?.(); break;
        case " ": e.preventDefault(); onSkipDelay?.(); break;
        case "escape": e.preventDefault(); onPause?.(); break;
      }
    }

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [active, onCopy, onOpen, onSuccess, onFail, onSkipDelay, onPause]);
}

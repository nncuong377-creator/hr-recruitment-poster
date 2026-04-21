'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { PostJob, QueueProgressPayload, QueueDonePayload } from '@/types/extension';

export type ExtJobStatus = 'pending' | 'running' | 'success' | 'failed';

export interface ExtJobState {
  jobId: string;
  groupId: string;
  status: ExtJobStatus;
  error?: string;
}

interface ExtPostingState {
  isPosting: boolean;
  isDone: boolean;
  error: string | null;
  jobs: ExtJobState[];
  doneCount: number;
  totalCount: number;
}

const initialState: ExtPostingState = {
  isPosting: false,
  isDone: false,
  error: null,
  jobs: [],
  doneCount: 0,
  totalCount: 0,
};

export function useExtensionPosting() {
  const [state, setState] = useState<ExtPostingState>(initialState);
  const contentIdRef = useRef<string | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function clearStartTimeout() {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }

  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      const msg = event.data as { source?: string; type?: string; payload?: unknown };
      if (!msg || msg.source !== 'hr-poster-extension') return;

      if (msg.type === 'QUEUE_PROGRESS') {
        const payload = msg.payload as QueueProgressPayload;
        clearStartTimeout();

        setState((prev) => {
          const updatedJobs = prev.jobs.map((j) =>
            j.jobId === payload.jobId
              ? { ...j, status: payload.success ? ('success' as const) : ('failed' as const), error: payload.error }
              : j
          );

          // Mark next pending job as running (extension has a delay between groups)
          if (payload.doneCount < payload.totalCount) {
            const nextIdx = updatedJobs.findIndex((j) => j.status === 'pending');
            if (nextIdx >= 0) {
              updatedJobs[nextIdx] = { ...updatedJobs[nextIdx], status: 'running' };
            }
          }

          return { ...prev, doneCount: payload.doneCount, totalCount: payload.totalCount, jobs: updatedJobs };
        });

        // Ghi log vào DB
        if (contentIdRef.current) {
          fetch('/api/post-log', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contentId: contentIdRef.current,
              fbGroupId: payload.groupId,
              status: payload.success ? 'SUCCESS' : 'FAILED',
              errorMsg: payload.error || undefined,
            }),
          }).catch((err) => console.error('[ExtPosting] Lỗi ghi post-log:', err));
        }
      }

      if (msg.type === 'QUEUE_DONE') {
        clearStartTimeout();
        const payload = msg.payload as QueueDonePayload | undefined;
        const hasQueueError = !!payload?.error;
        setState((prev) => ({
          ...prev,
          isPosting: false,
          isDone: true,
          error: hasQueueError ? (payload!.error ?? null) : null,
        }));
      }

      if (msg.type === 'START_QUEUE_RESPONSE') {
        clearStartTimeout();
        const payload = msg.payload as { success: boolean; error?: string; queued?: number } | undefined;
        if (!payload?.success) {
          setState((prev) => ({
            ...prev,
            isPosting: false,
            error: payload?.error ?? 'Extension trả về lỗi khi bắt đầu queue',
          }));
        }
      }

      if (msg.type === 'ERROR') {
        clearStartTimeout();
        const payload = msg.payload as { error?: string } | undefined;
        setState((prev) => ({
          ...prev,
          isPosting: false,
          error: payload?.error ?? 'Extension lỗi không xác định',
        }));
      }
    }

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const startPosting = useCallback((jobs: PostJob[], contentId: string) => {
    contentIdRef.current = contentId;

    setState({
      isPosting: true,
      isDone: false,
      error: null,
      doneCount: 0,
      totalCount: jobs.length,
      jobs: jobs.map((j, i) => ({
        jobId: j.id,
        groupId: j.groupId,
        status: i === 0 ? 'running' : 'pending',
      })),
    });

    // Timeout 5s nếu extension không phản hồi
    timeoutRef.current = setTimeout(() => {
      setState((prev) => {
        if (prev.isPosting && prev.doneCount === 0 && !prev.error) {
          return {
            ...prev,
            isPosting: false,
            error: 'Extension không phản hồi sau 5 giây. Hãy kiểm tra extension đã được bật chưa.',
          };
        }
        return prev;
      });
    }, 5000);

    window.postMessage(
      { source: 'hr-poster-webapp', type: 'START_QUEUE', payload: jobs, timestamp: Date.now() },
      '*'
    );
  }, []);

  const stopPosting = useCallback(() => {
    clearStartTimeout();
    // STOP_QUEUE — extension hiện chưa handle, nhưng gửi để tương thích version sau
    window.postMessage({ source: 'hr-poster-webapp', type: 'STOP_QUEUE', timestamp: Date.now() }, '*');
    setState((prev) => ({ ...prev, isPosting: false }));
  }, []);

  const reset = useCallback(() => {
    clearStartTimeout();
    contentIdRef.current = null;
    setState(initialState);
  }, []);

  return { state, startPosting, stopPosting, reset };
}

"use client";

import { useReducer, useCallback } from "react";

export interface ContentItem {
  id: string;
  title: string;
  position: string;
  description: string;
  hashtags: string;
  status: string;
  createdAt: string;
  medias: { id: string; url: string; type: string }[];
  author: { name: string };
  _count: { postLogs: number };
}

export interface GroupItem {
  id: string;
  name: string;
  url: string;
  category: string;
  memberCount: number | null;
  notes: string;
  lastPostedAt: string | null;
  isActive: boolean;
  _count: { postLogs: number };
}

export type GroupStatus = "pending" | "success" | "failed" | "skipped";
export type PostingPhase = "idle" | "copying" | "opened" | "confirming_success" | "confirming_fail" | "delay" | "paused";

interface PostingState {
  step: 1 | 2 | 3;
  selectedContent: ContentItem | null;
  selectedGroups: GroupItem[];
  currentIndex: number;
  statusMap: Record<string, GroupStatus>;
  phase: PostingPhase;
  sessionId: string | null;
  absolutePath: string | null;
  mediaCount: number;
  isPaused: boolean;
  isDone: boolean;
}

type PostingAction =
  | { type: "SELECT_CONTENT"; content: ContentItem }
  | { type: "SET_GROUPS"; groups: GroupItem[] }
  | { type: "TOGGLE_GROUP"; group: GroupItem }
  | { type: "REORDER_GROUP"; fromIndex: number; toIndex: number }
  | { type: "SET_STEP"; step: 1 | 2 | 3 }
  | { type: "SET_PHASE"; phase: PostingPhase }
  | { type: "MARK_STATUS"; groupId: string; status: GroupStatus }
  | { type: "NEXT_GROUP" }
  | { type: "JUMP_TO"; index: number }
  | { type: "PAUSE" }
  | { type: "RESUME" }
  | { type: "DONE" }
  | { type: "SET_SESSION"; sessionId: string | null; absolutePath: string | null; mediaCount: number }
  | { type: "RESET" };

const initialState: PostingState = {
  step: 1,
  selectedContent: null,
  selectedGroups: [],
  currentIndex: 0,
  statusMap: {},
  phase: "idle",
  sessionId: null,
  absolutePath: null,
  mediaCount: 0,
  isPaused: false,
  isDone: false,
};

function reducer(state: PostingState, action: PostingAction): PostingState {
  switch (action.type) {
    case "SELECT_CONTENT":
      return { ...state, selectedContent: action.content };

    case "SET_GROUPS":
      return {
        ...state,
        selectedGroups: action.groups,
        statusMap: Object.fromEntries(action.groups.map((g) => [g.id, "pending" as GroupStatus])),
      };

    case "TOGGLE_GROUP": {
      const exists = state.selectedGroups.some((g) => g.id === action.group.id);
      const selectedGroups = exists
        ? state.selectedGroups.filter((g) => g.id !== action.group.id)
        : [...state.selectedGroups, action.group];
      const statusMap = { ...state.statusMap };
      if (!exists) statusMap[action.group.id] = "pending";
      else delete statusMap[action.group.id];
      return { ...state, selectedGroups, statusMap };
    }

    case "REORDER_GROUP": {
      const groups = [...state.selectedGroups];
      const [item] = groups.splice(action.fromIndex, 1);
      groups.splice(action.toIndex, 0, item);
      return { ...state, selectedGroups: groups };
    }

    case "SET_STEP":
      return { ...state, step: action.step, phase: "idle" };

    case "SET_PHASE":
      return { ...state, phase: action.phase };

    case "MARK_STATUS":
      return {
        ...state,
        statusMap: { ...state.statusMap, [action.groupId]: action.status },
      };

    case "NEXT_GROUP": {
      const nextIndex = state.currentIndex + 1;
      const isDone = nextIndex >= state.selectedGroups.length;
      return {
        ...state,
        currentIndex: nextIndex,
        phase: isDone ? "idle" : "delay",
        isDone,
      };
    }

    case "JUMP_TO":
      return { ...state, currentIndex: action.index, phase: "idle", isPaused: false };

    case "PAUSE":
      return { ...state, isPaused: true };

    case "RESUME":
      return { ...state, isPaused: false };

    case "DONE":
      return { ...state, isDone: true, phase: "idle" };

    case "SET_SESSION":
      return { ...state, sessionId: action.sessionId, absolutePath: action.absolutePath, mediaCount: action.mediaCount };

    case "RESET":
      return { ...initialState };

    default:
      return state;
  }
}

const STORAGE_KEY = "hr-poster-posting-session";

interface PersistedSession {
  contentId: string;
  groupIds: string[];
  currentIndex: number;
  statusMap: Record<string, GroupStatus>;
}

export function usePostingSession() {
  const [state, dispatch] = useReducer(reducer, initialState);

  const saveToStorage = useCallback((
    content: ContentItem,
    groups: GroupItem[],
    currentIndex: number,
    statusMap: Record<string, GroupStatus>
  ) => {
    try {
      const data: PersistedSession = {
        contentId: content.id,
        groupIds: groups.map((g) => g.id),
        currentIndex,
        statusMap,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch { /* ignore */ }
  }, []);

  const clearStorage = useCallback(() => {
    try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
  }, []);

  const loadFromStorage = useCallback((): PersistedSession | null => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      return JSON.parse(raw) as PersistedSession;
    } catch { return null; }
  }, []);

  return { state, dispatch, saveToStorage, clearStorage, loadFromStorage };
}

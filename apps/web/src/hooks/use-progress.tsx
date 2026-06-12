"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
} from "react";
import type { ReactNode } from "react";
import { registry } from "../content/registry";
import {
  parseProgressCookie,
  serializeProgressCookie,
  parseVidCookie,
  serializeVidCookie,
  isLessonDone as checkLessonDone,
  setLessonDone as updateLessonDone,
  moduleDoneCount,
} from "../lib/progress";

interface ProgressStats {
  done: number;
  total: number;
  percentage: number;
}

interface ProgressContextType {
  ready: boolean;
  vid: string | null;
  isDone: (moduleId: string, lessonIndex: number) => boolean;
  markDone: (moduleId: string, lessonIndex: number, done: boolean) => void;
  toggle: (moduleId: string, lessonIndex: number) => void;
  moduleProgress: (moduleId: string) => ProgressStats;
  overall: ProgressStats;
  reset: () => void;
}

const ProgressContext = createContext<ProgressContextType | undefined>(undefined);

// cookie を「外部ストア」として useSyncExternalStore で購読する。
// ・SSR(getServerSnapshot="")→ クライアント値への切替を React が hydration セーフに処理
// ・effect 内の同期 setState を排除(react-hooks/set-state-in-effect 回避)
// 書き込みは全て本モジュール経由なので、書込後に emitChange() で購読者へ通知する。
const listeners = new Set<() => void>();
function emitChange() {
  for (const l of listeners) l();
}
function subscribe(cb: () => void): () => void {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}
function getCookieSnapshot(): string {
  return typeof document === "undefined" ? "" : document.cookie;
}
function getServerSnapshot(): string {
  return "";
}

function isSecure(): boolean {
  return typeof window !== "undefined" && window.location.protocol === "https:";
}

export function ProgressProvider({ children }: { children: ReactNode }) {
  // クライアントで true。SSR/初回 hydration では false(getServerSnapshot)。
  const ready = useSyncExternalStore(
    subscribe,
    () => true,
    () => false
  );
  const cookieStr = useSyncExternalStore(subscribe, getCookieSnapshot, getServerSnapshot);

  const progress = useMemo(() => parseProgressCookie(cookieStr), [cookieStr]);
  const vid = useMemo(() => parseVidCookie(cookieStr), [cookieStr]);

  // vid 未発行ならクライアント初回に生成(cookie 書込のみ。setState は呼ばない)。
  useEffect(() => {
    if (!parseVidCookie(getCookieSnapshot())) {
      document.cookie = serializeVidCookie(crypto.randomUUID(), isSecure());
      emitChange();
    }
  }, []);

  const saveProgress = useCallback((next: Record<string, number>) => {
    document.cookie = serializeProgressCookie(next, isSecure());
    emitChange();
  }, []);

  const isDone = useCallback(
    (moduleId: string, lessonIndex: number): boolean =>
      checkLessonDone(progress, moduleId, lessonIndex),
    [progress]
  );

  const markDone = useCallback(
    (moduleId: string, lessonIndex: number, done: boolean) => {
      // 最新の cookie を読んで更新(stale closure 回避 → markDone を安定参照にできる)
      const current = parseProgressCookie(getCookieSnapshot());
      saveProgress(updateLessonDone(current, moduleId, lessonIndex, done));
    },
    [saveProgress]
  );

  const toggle = useCallback(
    (moduleId: string, lessonIndex: number) => {
      const current = parseProgressCookie(getCookieSnapshot());
      markDone(moduleId, lessonIndex, !checkLessonDone(current, moduleId, lessonIndex));
    },
    [markDone]
  );

  const reset = useCallback(() => {
    saveProgress({});
  }, [saveProgress]);

  const moduleProgress = useCallback(
    (moduleId: string): ProgressStats => {
      const mod = registry.find((m) => m.id === moduleId);
      if (!mod) return { done: 0, total: 0, percentage: 0 };
      const total = mod.lessons.filter((l) => !l.draft).length;
      const done = ready ? moduleDoneCount(progress, moduleId) : 0;
      const percentage = total > 0 ? Math.round((done / total) * 100) : 0;
      return { done, total, percentage };
    },
    [progress, ready]
  );

  const overall = useMemo((): ProgressStats => {
    let total = 0;
    let done = 0;
    for (const mod of registry) {
      total += mod.lessons.filter((l) => !l.draft).length;
      if (ready) done += moduleDoneCount(progress, mod.id);
    }
    const percentage = total > 0 ? Math.round((done / total) * 100) : 0;
    return { done, total, percentage };
  }, [progress, ready]);

  const value = useMemo<ProgressContextType>(
    () => ({ ready, vid, isDone, markDone, toggle, moduleProgress, overall, reset }),
    [ready, vid, isDone, markDone, toggle, moduleProgress, overall, reset]
  );

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>;
}

export function useProgress() {
  const context = useContext(ProgressContext);
  if (context === undefined) {
    throw new Error("useProgress must be used within a ProgressProvider");
  }
  return context;
}

import { registry } from "../content/registry";

export function parseProgressCookie(cookieStr: string): Record<string, number> {
  if (!cookieStr) return {};
  const match = cookieStr.match(/(?:^|; )cfsl_progress=([^;]*)/);
  if (!match) return {};
  try {
    const decoded = decodeURIComponent(match[1]);
    const parsed = JSON.parse(decoded);
    if (typeof parsed === "object" && parsed !== null) {
      return parsed as Record<string, number>;
    }
  } catch {
    // Ignore invalid JSON parsing
  }
  return {};
}

export function serializeProgressCookie(progress: Record<string, number>, secure = false): string {
  const value = encodeURIComponent(JSON.stringify(progress));
  let cookie = `cfsl_progress=${value}; Path=/; Max-Age=31536000; SameSite=Lax`;
  if (secure) {
    cookie += "; Secure";
  }
  return cookie;
}

export function parseVidCookie(cookieStr: string): string | null {
  if (!cookieStr) return null;
  const match = cookieStr.match(/(?:^|; )cfsl_vid=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : null;
}

export function serializeVidCookie(vid: string, secure = false): string {
  let cookie = `cfsl_vid=${encodeURIComponent(vid)}; Path=/; Max-Age=31536000; SameSite=Lax`;
  if (secure) {
    cookie += "; Secure";
  }
  return cookie;
}

// 進捗 bitmask は JS のビット演算(32bit 符号付き整数)で扱うため、
// 1 モジュールのレッスン数は最大 31(bit index 0..30)。
// 超える場合は BigInt か配列形式への移行が必要(progress.test.ts で上限を強制)。
export function isLessonDone(
  progress: Record<string, number>,
  moduleId: string,
  lessonIndex: number
): boolean {
  const mask = progress[moduleId] ?? 0;
  return (mask & (1 << lessonIndex)) !== 0;
}

export function setLessonDone(
  progress: Record<string, number>,
  moduleId: string,
  lessonIndex: number,
  done: boolean
): Record<string, number> {
  const currentMask = progress[moduleId] ?? 0;
  let newMask = currentMask;
  if (done) {
    newMask |= 1 << lessonIndex;
  } else {
    newMask &= ~(1 << lessonIndex);
  }
  return {
    ...progress,
    [moduleId]: newMask,
  };
}

export function moduleDoneCount(progress: Record<string, number>, moduleId: string): number {
  const mod = registry.find((m) => m.id === moduleId);
  if (!mod) return 0;

  const mask = progress[moduleId] ?? 0;
  let count = 0;
  mod.lessons.forEach((lesson, index) => {
    if (!lesson.draft && (mask & (1 << index)) !== 0) {
      count++;
    }
  });
  return count;
}

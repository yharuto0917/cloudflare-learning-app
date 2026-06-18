/**
 * 数値を [min, max] にクランプして整数化する。NaN/非有限値は fallback を返す。
 * デモ API のパラメータ(TTL・limit 等)の正規化に使う。
 */
export function clampInt(value: unknown, min: number, max: number, fallback: number): number {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, Math.floor(n)));
}

/** UTF-8 バイト長。値サイズ上限(KV 1KB / R2 2MB 等)の判定に使う。 */
export function byteLength(input: string | ArrayBuffer): number {
  return typeof input === "string" ? new TextEncoder().encode(input).length : input.byteLength;
}

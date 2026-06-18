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

/**
 * Range ヘッダ(`bytes=a-b` / `bytes=a-` / `bytes=-N`)を R2Range(POJO)へパースする。
 * 不正・複数レンジ・全体指定は undefined(=レンジ無し)。
 *
 * 注意: `Request.headers`(Headers オブジェクト)をそのまま R2 の `range` に渡すと、OpenNext の
 * binding プロキシが devalue で引数を直列化できず 500 になる。必ずこの POJO 化を通す。
 */
export function parseRange(header: string | undefined): R2Range | undefined {
  if (!header) return undefined;
  const m = /^bytes=(\d*)-(\d*)$/.exec(header.trim());
  if (!m) return undefined;
  const [, startStr, endStr] = m;
  if (startStr === "" && endStr === "") return undefined;
  if (startStr === "") return { suffix: Number(endStr) }; // 末尾 N バイト
  const offset = Number(startStr);
  if (endStr === "") return { offset }; // offset 以降すべて
  return { offset, length: Number(endStr) - offset + 1 };
}

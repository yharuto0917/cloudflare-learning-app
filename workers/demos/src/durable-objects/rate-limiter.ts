import { DurableObject } from "cloudflare:workers";

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  /** ウィンドウがリセットされる時刻(epoch ms)。 */
  resetAt: number;
  limit: number;
}

export interface RateLimitWindowState {
  key: string;
  count: number;
  resetAt: number;
  limit: number;
  windowSec: number;
}

/**
 * RateLimiter — 固定ウィンドウ方式のレート制限 DO。
 *
 * 1インスタンス = 1利用者(`getByName(vid)`)とし、その中で `key`(操作種別)ごとに
 * カウントとリセット時刻を sql storage に保持する。DO の直列実行により、
 * 同時リクエストでもカウントの取りこぼし/競合が起きないのが教材ポイント。
 */
export class RateLimiter extends DurableObject<Env> {
  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    ctx.blockConcurrencyWhile(async () => {
      this.ctx.storage.sql.exec(
        `CREATE TABLE IF NOT EXISTS windows (
          key TEXT PRIMARY KEY,
          count INTEGER NOT NULL,
          reset_at INTEGER NOT NULL,
          limit_val INTEGER NOT NULL,
          window_sec INTEGER NOT NULL
        )`
      );
    });
  }

  /**
   * key へのアクセスを1回分計上し、許可可否を返す。
   * ウィンドウが未作成 or 期限切れなら新ウィンドウを開始する。
   */
  check(key: string, limit: number, windowSec: number): RateLimitResult {
    const now = Date.now();
    const row = this.ctx.storage.sql
      .exec<{
        count: number;
        reset_at: number;
      }>(`SELECT count, reset_at FROM windows WHERE key = ?`, key)
      .toArray()[0];

    // 新しいウィンドウ(初回 or 期限切れ)
    if (!row || row.reset_at <= now) {
      const resetAt = now + windowSec * 1000;
      this.ctx.storage.sql.exec(
        `INSERT OR REPLACE INTO windows (key, count, reset_at, limit_val, window_sec)
         VALUES (?, ?, ?, ?, ?)`,
        key,
        1,
        resetAt,
        limit,
        windowSec
      );
      return { allowed: true, remaining: Math.max(0, limit - 1), resetAt, limit };
    }

    // 既存ウィンドウ: 上限到達なら拒否(カウントは増やさない)
    if (row.count >= limit) {
      return { allowed: false, remaining: 0, resetAt: row.reset_at, limit };
    }

    const count = row.count + 1;
    this.ctx.storage.sql.exec(
      `UPDATE windows SET count = ?, limit_val = ?, window_sec = ? WHERE key = ?`,
      count,
      limit,
      windowSec,
      key
    );
    return {
      allowed: true,
      remaining: Math.max(0, limit - count),
      resetAt: row.reset_at,
      limit,
    };
  }

  /** 可視化用に、保持中の全ウィンドウの状態を返す。 */
  state(): RateLimitWindowState[] {
    return this.ctx.storage.sql
      .exec<{
        key: string;
        count: number;
        reset_at: number;
        limit_val: number;
        window_sec: number;
      }>(`SELECT key, count, reset_at, limit_val, window_sec FROM windows ORDER BY key`)
      .toArray()
      .map((r) => ({
        key: r.key,
        count: r.count,
        resetAt: r.reset_at,
        limit: r.limit_val,
        windowSec: r.window_sec,
      }));
  }
}

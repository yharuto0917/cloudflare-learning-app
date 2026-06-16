import { DurableObject } from "cloudflare:workers";

export interface AlarmFiredLog {
  firedAt: number;
  retryCount: number;
  isRetry: boolean;
}

export interface AlarmStatus {
  /** 次回発火予定(epoch ms)。未設定なら null。 */
  scheduledFor: number | null;
  fired: AlarmFiredLog[];
}

const MIN_SECONDS = 5;
const MAX_SECONDS = 120;

/**
 * AlarmClock — DO Alarm のデモ。`getByName(vid)` で利用者ごとに1つ。
 *
 * 教材ポイント: Alarm は **at-least-once**。ハンドラが throw すると最大6回まで
 * 指数バックオフで自動リトライされ、`alarm(info)` の `info.retryCount` / `info.isRetry`
 * で何度目かが分かる。冪等なハンドラ設計が重要であることを示す。
 * 発火履歴は sql storage に追記し、status() で可視化する。
 */
export class AlarmClock extends DurableObject<Env> {
  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    ctx.blockConcurrencyWhile(async () => {
      this.ctx.storage.sql.exec(
        `CREATE TABLE IF NOT EXISTS fired (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          fired_at INTEGER NOT NULL,
          retry_count INTEGER NOT NULL,
          is_retry INTEGER NOT NULL
        )`
      );
    });
  }

  /** seconds 後にアラームを設定(5〜120 秒にクランプ)。setAlarm は既存を置き換える。 */
  async schedule(seconds: number): Promise<{ scheduledFor: number }> {
    const clamped = Math.min(MAX_SECONDS, Math.max(MIN_SECONDS, Math.floor(seconds)));
    const scheduledFor = Date.now() + clamped * 1000;
    await this.ctx.storage.setAlarm(scheduledFor);
    return { scheduledFor };
  }

  /** 次回発火予定と直近の発火履歴(最大20件)を返す。 */
  async status(): Promise<AlarmStatus> {
    const scheduledFor = await this.ctx.storage.getAlarm();
    const fired = this.ctx.storage.sql
      .exec<{ fired_at: number; retry_count: number; is_retry: number }>(
        `SELECT fired_at, retry_count, is_retry FROM fired ORDER BY id DESC LIMIT 20`
      )
      .toArray()
      .map((r) => ({
        firedAt: r.fired_at,
        retryCount: r.retry_count,
        isRetry: r.is_retry === 1,
      }));
    return { scheduledFor, fired };
  }

  /** 予定中のアラームを取り消す。取り消し対象があったかを返す。 */
  async cancel(): Promise<{ cancelled: boolean }> {
    const had = (await this.ctx.storage.getAlarm()) !== null;
    await this.ctx.storage.deleteAlarm();
    return { cancelled: had };
  }

  /** アラーム発火ハンドラ。発火を記録する(冪等な追記)。 */
  async alarm(alarmInfo?: { retryCount: number; isRetry: boolean }): Promise<void> {
    this.ctx.storage.sql.exec(
      `INSERT INTO fired (fired_at, retry_count, is_retry) VALUES (?, ?, ?)`,
      Date.now(),
      alarmInfo?.retryCount ?? 0,
      alarmInfo?.isRetry ? 1 : 0
    );
  }
}

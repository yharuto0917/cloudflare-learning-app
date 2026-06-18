import { Container } from "@cloudflare/containers";
import type { StopParams } from "@cloudflare/containers";

export interface ContainerEvent {
  event: "start" | "stop" | "error";
  at: number;
  /** stop の exitCode/reason や error メッセージなどの補足。無ければ null。 */
  detail: string | null;
}

/** イベントログのリングバッファ上限(sql storage の肥大化防止)。 */
const MAX_EVENTS = 50;

/**
 * DemoContainer — Cloudflare Containers のデモ実体。
 *
 * 教材ポイント: Container は Durable Object の一種で、永続 ID を持つ一方で
 * **コンテナのディスクは ephemeral**(stop で消える)。そのため永続化が必要な情報は
 * DO の `ctx.storage`(ここでは sql)に保持する。本クラスは start/stop/error の
 * ライフサイクルイベントを sql のリングバッファに記録し、可視化デモがポーリングする。
 *
 * `sleepAfter` を既定より短くしてアイドル時のコストを抑える(デモ用)。
 */
export class DemoContainer extends Container<Env> {
  /** コンテナ内 node サーバーの待受ポート(server.mjs / Dockerfile と一致)。 */
  defaultPort = 8080;
  /** デモ用に短く設定(コスト対策。既定は長め)。 */
  sleepAfter = "2m";
  /**
   * 健全性チェック(ポート待機)の宛先。基底は `http://${pingEndpoint}` を組むため先頭スラッシュ無し。
   * 既定 'ping' は server.mjs では 404 になり requestCount を汚すため、専用の /healthz に向ける。
   */
  pingEndpoint = "ping/healthz";

  /** コンテナ起動成功時。 */
  override onStart(): void {
    this.record("start", null);
  }

  /** コンテナ停止時(SIGTERM〜exit)。exitCode と reason を記録する。 */
  override onStop(params: StopParams): void {
    this.record("stop", `exitCode=${params.exitCode}, reason=${params.reason}`);
  }

  /**
   * コンテナ起動失敗/クラッシュ時の通知フック。発火を記録するのみ。
   * 戻り値・throw とも基底フレームワークに無視される(実際のエラー伝播/リトライは基底が制御)ため、
   * ここでは記録だけ行い何も返さない。
   */
  override onError(error: unknown): void {
    this.record("error", error instanceof Error ? error.message : String(error));
  }

  /** ライフサイクルイベントログ(新しい順・最大 MAX_EVENTS 件)を返す RPC。 */
  events(): ContainerEvent[] {
    this.ensureSchema();
    return this.ctx.storage.sql
      .exec<{
        event: string;
        at: number;
        detail: string | null;
      }>(`SELECT event, at, detail FROM events ORDER BY id DESC LIMIT ?`, MAX_EVENTS)
      .toArray()
      .map((r) => ({
        event: r.event as ContainerEvent["event"],
        at: r.at,
        detail: r.detail,
      }));
  }

  /**
   * events テーブルを用意する。Container 基底クラスの constructor を上書きせず、
   * 各操作の冒頭で冪等に呼ぶ(ライフサイクルフックが最初の書き込みになっても安全)。
   */
  private ensureSchema(): void {
    this.ctx.storage.sql.exec(
      `CREATE TABLE IF NOT EXISTS events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        event TEXT NOT NULL,
        at INTEGER NOT NULL,
        detail TEXT
      )`
    );
  }

  /** イベントを追記し、古い行を間引いてリングバッファに保つ。 */
  private record(event: ContainerEvent["event"], detail: string | null): void {
    this.ensureSchema();
    this.ctx.storage.sql.exec(
      `INSERT INTO events (event, at, detail) VALUES (?, ?, ?)`,
      event,
      Date.now(),
      detail
    );
    this.ctx.storage.sql.exec(
      `DELETE FROM events WHERE id <= (SELECT MAX(id) FROM events) - ?`,
      MAX_EVENTS
    );
  }
}

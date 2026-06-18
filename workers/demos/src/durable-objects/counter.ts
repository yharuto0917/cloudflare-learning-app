import { DurableObject } from "cloudflare:workers";

/**
 * Counter — 単一インスタンス(`getByName("global")`)で全アクセスを直列化し、
 * 競合のないグローバルカウンタを実現する DO。
 *
 * 教材ポイント: DO は単一スレッドで実行されるため、複数同時 increment でも
 * ロック無しで原子的に加算できる(Workers/KV の eventual consistency との対比)。
 * 値は `ctx.storage.sql` に永続化し、ハイバネーション/再配置をまたいで保持する。
 */
export class Counter extends DurableObject<Env> {
  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    // スキーマ初期化は constructor 内の blockConcurrencyWhile でのみ行う(リクエスト毎は不可)。
    ctx.blockConcurrencyWhile(async () => {
      this.ctx.storage.sql.exec(
        `CREATE TABLE IF NOT EXISTS counter (id INTEGER PRIMARY KEY, value INTEGER NOT NULL)`
      );
      this.ctx.storage.sql.exec(`INSERT OR IGNORE INTO counter (id, value) VALUES (1, 0)`);
    });
  }

  /** by だけ加算し、加算後の値を返す。RETURNING で読み書きを1文に収める。 */
  increment(by = 1): number {
    return this.ctx.storage.sql
      .exec<{
        value: number;
      }>(`UPDATE counter SET value = value + ? WHERE id = 1 RETURNING value`, by)
      .one().value;
  }

  /** by だけ減算(increment の符号反転で実装)。 */
  decrement(by = 1): number {
    return this.increment(-by);
  }

  /** 現在値を返す。 */
  get(): number {
    return this.ctx.storage.sql
      .exec<{ value: number }>(`SELECT value FROM counter WHERE id = 1`)
      .one().value;
  }
}

import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema";

/**
 * D1(`env.DB`)に対する Drizzle クライアントを生成する。
 *
 * IMPORTANT: クライアントは**リクエスト毎に生成**すること。Workers では I/O オブジェクト
 * (D1Database 等)を別リクエストへ持ち越すと "Cannot perform I/O on behalf of a different
 * request" で失敗するため、モジュールスコープにキャッシュしてはいけない。
 */
export function getDb(env: CloudflareEnv) {
  return drizzle(env.DB, { schema });
}

export type Database = ReturnType<typeof getDb>;
export { schema };

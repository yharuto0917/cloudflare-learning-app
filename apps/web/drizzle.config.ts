import { defineConfig } from "drizzle-kit";

/**
 * Drizzle Kit 設定。
 *
 * このプロジェクトでは drizzle-kit を **`generate`(マイグレーション SQL 生成)専用**で使う。
 * マイグレーションの適用は `wrangler d1 migrations apply`(local/remote)で行うため、
 * `generate` 自体は D1 へ接続せず、ここの `dbCredentials` も参照しない。
 *
 * `driver: "d1-http"` と認証情報は `drizzle-kit studio` など remote 参照を将来使う場合のためだけに
 * 用意し、値は環境変数から読む(未設定なら空文字)。**`drizzle-kit push` は禁止**(同一 D1 に
 * OpenNext の tag-cache テーブルが同居し、スキーマ不整合・破壊のリスクがあるため。AGENTS.md 参照)。
 *
 * `out` は wrangler.jsonc の `d1_databases[0].migrations_dir`("drizzle")と一致させること。
 */
export default defineConfig({
  dialect: "sqlite",
  driver: "d1-http",
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dbCredentials: {
    accountId: process.env.CLOUDFLARE_ACCOUNT_ID ?? "",
    databaseId: process.env.CLOUDFLARE_DATABASE_ID ?? "",
    token: process.env.CLOUDFLARE_D1_TOKEN ?? "",
  },
});

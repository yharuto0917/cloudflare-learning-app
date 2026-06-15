import { sqliteTable, integer, text, index } from "drizzle-orm/sqlite-core";

/**
 * ゲストブックデモ用テーブル。
 *
 * - `vid`: 進捗トラッキングと同じ匿名 visitor id(Cookie)。投稿者の名寄せ・本人削除に使う。
 * - `createdAt`: timestamp mode で保存し、アプリ側では Date として扱う。
 * - `idx_guestbook_vid`: 「自分の投稿一覧」取得を想定し vid に索引を張る。
 *
 * NOTE: この D1 には OpenNext の tag-cache テーブルも同居するため、スキーマ変更は
 *       必ず drizzle-kit generate で migration を出力して適用する(drizzle-kit push は禁止)。
 */
export const guestbookEntries = sqliteTable(
  "guestbook_entries",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    vid: text("vid").notNull(),
    name: text("name").notNull(),
    message: text("message").notNull(),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  },
  (t) => [index("idx_guestbook_vid").on(t.vid)]
);

export type GuestbookEntry = typeof guestbookEntries.$inferSelect;
export type NewGuestbookEntry = typeof guestbookEntries.$inferInsert;

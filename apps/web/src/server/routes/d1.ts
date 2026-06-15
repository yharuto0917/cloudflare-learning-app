import { Hono } from "hono";
import { desc } from "drizzle-orm";
import { getDb } from "@/db";
import { guestbookEntries } from "@/db/schema";

// D1(DB)+ Drizzle デモ。P3-2 で Drizzle 配線の動作実証として最小の select/insert を実装する。
// Cookie 連携(vid)・バリデーション・UI など本格的なゲストブックは後続フェーズで拡張する。
export const d1Routes = new Hono<{ Bindings: CloudflareEnv }>();

// 一覧取得: マイグレーションで作られたテーブルへ Drizzle の select が通ることを実証。
d1Routes.get("/", async (c) => {
  const db = getDb(c.env);
  const entries = await db
    .select()
    .from(guestbookEntries)
    .orderBy(desc(guestbookEntries.createdAt))
    .limit(50);
  return c.json({ entries });
});

// 投稿: Drizzle の insert + returning が通ることを実証。
d1Routes.post("/", async (c) => {
  const body = await c.req
    .json<{ name?: string; message?: string; vid?: string }>()
    .catch(() => null);
  if (!body?.name || !body?.message) {
    return c.json({ error: "name and message are required" }, 400);
  }
  const db = getDb(c.env);
  const [entry] = await db
    .insert(guestbookEntries)
    .values({
      vid: body.vid ?? "anonymous",
      name: body.name,
      message: body.message,
      createdAt: new Date(),
    })
    .returning();
  return c.json({ entry }, 201);
});

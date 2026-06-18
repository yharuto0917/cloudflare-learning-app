import { Hono } from "hono";
import { and, desc, eq, inArray } from "drizzle-orm";
import { getDb } from "@/db";
import { guestbookEntries } from "@/db/schema";
import type { AppEnv } from "@/lib/vid";
import { requireVid } from "@/lib/vid";
import { rateLimit } from "@/lib/rate-limit";

/**
 * D1 + Drizzle のゲストブックデモ。
 * - 一覧は全 vid 横断の最新20件(他人の vid は返さず mine フラグのみ)。
 * - 投稿は name≤30 / message≤500。1 vid あたり最大5件で、超過時は自分の最古を自動削除。
 * - 削除は自分の行のみ。
 */
const NAME_MAX = 30;
const MESSAGE_MAX = 500;
const MAX_ENTRIES_PER_VID = 5;

export const d1Routes = new Hono<AppEnv>();

d1Routes.use("*", requireVid);

// 一覧: 最新20件。各行に mine(自分の投稿か)を付与。
d1Routes.get("/guestbook", async (c) => {
  const vid = c.get("vid");
  const db = getDb(c.env);
  const rows = await db
    .select()
    .from(guestbookEntries)
    .orderBy(desc(guestbookEntries.id))
    .limit(20);
  return c.json({
    entries: rows.map((r) => ({
      id: r.id,
      name: r.name,
      message: r.message,
      createdAt: r.createdAt,
      mine: r.vid === vid,
    })),
  });
});

// 投稿: バリデーション → insert → 1vid 上限を超えたら自分の最古を削除。
d1Routes.post("/guestbook", rateLimit("d1-write", 10, 60), async (c) => {
  const body = (await c.req.json().catch(() => ({}))) as { name?: unknown; message?: unknown };
  const name = String(body.name ?? "").trim();
  const message = String(body.message ?? "").trim();

  if (name.length < 1 || name.length > NAME_MAX) {
    return c.json(
      { error: "invalid_name", message: `名前は1〜${NAME_MAX}文字で入力してください。` },
      400
    );
  }
  if (message.length < 1 || message.length > MESSAGE_MAX) {
    return c.json(
      {
        error: "invalid_message",
        message: `メッセージは1〜${MESSAGE_MAX}文字で入力してください。`,
      },
      400
    );
  }

  const vid = c.get("vid");
  const db = getDb(c.env);
  const [entry] = await db
    .insert(guestbookEntries)
    .values({ vid, name, message, createdAt: new Date() })
    .returning();

  // 自分の投稿が上限を超えたら、古いものから自動削除(最新 MAX_ENTRIES_PER_VID 件を保持)。
  const own = await db
    .select({ id: guestbookEntries.id })
    .from(guestbookEntries)
    .where(eq(guestbookEntries.vid, vid))
    .orderBy(desc(guestbookEntries.id));
  if (own.length > MAX_ENTRIES_PER_VID) {
    const staleIds = own.slice(MAX_ENTRIES_PER_VID).map((r) => r.id);
    await db.delete(guestbookEntries).where(inArray(guestbookEntries.id, staleIds));
  }

  return c.json(
    {
      entry: {
        id: entry.id,
        name: entry.name,
        message: entry.message,
        createdAt: entry.createdAt,
        mine: true,
      },
    },
    201
  );
});

// 削除: 自分の行のみ。対象が無ければ 404。
d1Routes.delete("/guestbook/:id", rateLimit("d1-write", 10, 60), async (c) => {
  const id = Number(c.req.param("id"));
  if (!Number.isInteger(id)) return c.json({ error: "invalid_id" }, 400);

  const vid = c.get("vid");
  const db = getDb(c.env);
  const deleted = await db
    .delete(guestbookEntries)
    .where(and(eq(guestbookEntries.id, id), eq(guestbookEntries.vid, vid)))
    .returning({ id: guestbookEntries.id });

  if (deleted.length === 0) {
    return c.json(
      { error: "not_found_or_not_owner", message: "自分の投稿のみ削除できます。" },
      404
    );
  }
  return c.json({ id, ok: true });
});

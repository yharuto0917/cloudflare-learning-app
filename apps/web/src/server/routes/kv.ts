import { Hono } from "hono";
import type { AppEnv } from "@/lib/vid";
import { requireVid } from "@/lib/vid";
import { rateLimit } from "@/lib/rate-limit";
import { byteLength, clampInt } from "@/server/util";

/**
 * KV(DEMO_KV)デモ。すべて vid 名前空間(`demo:{vid}:{key}`)に閉じる。
 * 値≤1KB・TTL 60〜86400・≤20 キー/vid の上限を課す。
 */
const KEY_PREFIX = (vid: string) => `demo:${vid}:`;
const USER_KEY_MAX_LEN = 64;
const VALUE_MAX_BYTES = 1024;
const TTL_MIN = 60;
const TTL_MAX = 86400;
const TTL_DEFAULT = 3600;
const MAX_KEYS_PER_VID = 20;
const BULK_GET_MAX = 100;

export const kvRoutes = new Hono<AppEnv>();

// 全ルートで vid 必須(名前空間に使う)。
kvRoutes.use("*", requireVid);

/** vid 配下の保持キー数を数える(上限判定用)。 */
async function countKeys(kv: KVNamespace, vid: string): Promise<number> {
  let count = 0;
  let cursor: string | undefined;
  do {
    const res = await kv.list({ prefix: KEY_PREFIX(vid), cursor, limit: 1000 });
    count += res.keys.length;
    cursor = res.list_complete ? undefined : res.cursor;
  } while (cursor);
  return count;
}

// 一覧: prefix 強制 + cursor ページング。表示用にキーは prefix を除去して返す。
kvRoutes.get("/list", async (c) => {
  const vid = c.get("vid");
  const cursor = c.req.query("cursor") || undefined;
  const res = await c.env.DEMO_KV.list({ prefix: KEY_PREFIX(vid), cursor, limit: 100 });
  const prefix = KEY_PREFIX(vid);
  return c.json({
    keys: res.keys.map((k) => ({
      key: k.name.slice(prefix.length),
      expiration: k.expiration ?? null,
    })),
    list_complete: res.list_complete,
    cursor: res.list_complete ? null : res.cursor,
  });
});

// 一括取得: ≤100 キー。存在しないキーは null。
kvRoutes.post("/bulk-get", async (c) => {
  const body = (await c.req.json().catch(() => ({}))) as { keys?: unknown };
  if (!Array.isArray(body.keys)) {
    return c.json({ error: "invalid_body", message: "keys は文字列配列で指定してください。" }, 400);
  }
  if (body.keys.length > BULK_GET_MAX) {
    return c.json(
      { error: "too_many_keys", message: `一度に取得できるのは ${BULK_GET_MAX} キーまでです。` },
      400
    );
  }
  const vid = c.get("vid");
  const keys = body.keys.map((k) => String(k).slice(0, USER_KEY_MAX_LEN));
  const entries = await Promise.all(
    keys.map(async (key) => [key, await c.env.DEMO_KV.get(`${KEY_PREFIX(vid)}${key}`)] as const)
  );
  return c.json({ values: Object.fromEntries(entries) });
});

// 取得: 未設定なら 404。
kvRoutes.get("/:key", async (c) => {
  const vid = c.get("vid");
  const key = c.req.param("key").slice(0, USER_KEY_MAX_LEN);
  const value = await c.env.DEMO_KV.get(`${KEY_PREFIX(vid)}${key}`);
  if (value === null) {
    return c.json({ error: "not_found", key }, 404);
  }
  return c.json({ key, value });
});

// 保存: 値≤1KB・TTL クランプ・キー数上限。
kvRoutes.put("/:key", rateLimit("kv-write", 30, 60), async (c) => {
  const vid = c.get("vid");
  const key = c.req.param("key").slice(0, USER_KEY_MAX_LEN);
  const value = await c.req.text();

  if (byteLength(value) > VALUE_MAX_BYTES) {
    return c.json(
      { error: "value_too_large", message: `値は ${VALUE_MAX_BYTES} バイト以下にしてください。` },
      413
    );
  }

  const fullKey = `${KEY_PREFIX(vid)}${key}`;
  // 新規キーのときだけキー数上限を確認(既存キーの上書きは常に許可)。
  const exists = (await c.env.DEMO_KV.get(fullKey)) !== null;
  if (!exists && (await countKeys(c.env.DEMO_KV, vid)) >= MAX_KEYS_PER_VID) {
    return c.json(
      {
        error: "key_limit_reached",
        message: `保持できるキーは ${MAX_KEYS_PER_VID} 個までです。不要なキーを削除してください。`,
      },
      409
    );
  }

  const expirationTtl = clampInt(c.req.query("ttl"), TTL_MIN, TTL_MAX, TTL_DEFAULT);
  await c.env.DEMO_KV.put(fullKey, value, { expirationTtl });
  return c.json({ key, ok: true, expirationTtl });
});

// 削除。
kvRoutes.delete("/:key", rateLimit("kv-write", 30, 60), async (c) => {
  const vid = c.get("vid");
  const key = c.req.param("key").slice(0, USER_KEY_MAX_LEN);
  await c.env.DEMO_KV.delete(`${KEY_PREFIX(vid)}${key}`);
  return c.json({ key, ok: true });
});

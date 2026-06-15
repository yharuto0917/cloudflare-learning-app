import { Hono } from "hono";

// デモ用 KV(DEMO_KV)への最小アクセス。
// P3-1 の目的は `c.env.DEMO_KV` のローカルアクセス実証。
// 本実装(list / bulk-get / 上限・エラーメッセージ等)は P3-5(Issue #20)で行う。
export const kvRoutes = new Hono<{ Bindings: CloudflareEnv }>();

kvRoutes.get("/:key", async (c) => {
  const key = c.req.param("key");
  const value = await c.env.DEMO_KV.get(key);
  return c.json({ key, value });
});

kvRoutes.put("/:key", async (c) => {
  const key = c.req.param("key");
  const body = await c.req.text();
  await c.env.DEMO_KV.put(key, body);
  return c.json({ key, ok: true });
});

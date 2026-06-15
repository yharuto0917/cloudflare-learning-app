import { Hono } from "hono";
import { getBooleanFlag } from "@/lib/flags";

// Flagship デモ。骨格のみだが、flags.ts のフォールバック動作を最小確認する。
// 本実装(評価コンテキスト・variant 等)は P3-5 / P10。
export const flagshipRoutes = new Hono<{ Bindings: CloudflareEnv }>();

// 評価失敗時(placeholder app_id / remote 不通)は default=false にフォールバックする。
flagshipRoutes.get("/:key", async (c) => {
  const key = c.req.param("key");
  const value = await getBooleanFlag(c.env, key, false);
  return c.json({ key, value });
});

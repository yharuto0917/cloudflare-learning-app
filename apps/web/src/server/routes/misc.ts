import { Hono } from "hono";

// 雑多なエンドポイント群。P3-1 ではヘルスチェックのみ。
export const miscRoutes = new Hono<{ Bindings: CloudflareEnv }>();

// ヘルスチェック(P3-1 受け入れ条件: /api/health 応答)
miscRoutes.get("/health", (c) => c.json({ ok: true }));

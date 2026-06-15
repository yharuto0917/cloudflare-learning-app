import { Hono } from "hono";

// Durable Objects デモ(demos worker 側へプロキシ予定)。骨格のみ。本実装は P3-3 / P3-5。
export const doRoutes = new Hono<{ Bindings: CloudflareEnv }>();

doRoutes.all("*", (c) => c.json({ error: "not_implemented", demo: "do" }, 501));

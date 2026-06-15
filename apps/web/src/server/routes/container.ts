import { Hono } from "hono";

// Containers デモ(demos worker 側へプロキシ予定)。骨格のみ。本実装は P3-4 / P3-5。
export const containerRoutes = new Hono<{ Bindings: CloudflareEnv }>();

containerRoutes.all("*", (c) => c.json({ error: "not_implemented", demo: "container" }, 501));

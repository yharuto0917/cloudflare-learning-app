import { Hono } from "hono";

// D1(DB)+ Drizzle デモ。骨格のみ。本実装は P3-2 / P3-5。
export const d1Routes = new Hono<{ Bindings: CloudflareEnv }>();

d1Routes.all("*", (c) => c.json({ error: "not_implemented", demo: "d1" }, 501));

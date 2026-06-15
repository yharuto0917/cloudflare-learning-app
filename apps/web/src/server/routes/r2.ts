import { Hono } from "hono";

// R2(DEMO_BUCKET)デモ。骨格のみ。本実装は P3-5(Issue #20)。
export const r2Routes = new Hono<{ Bindings: CloudflareEnv }>();

r2Routes.all("*", (c) => c.json({ error: "not_implemented", demo: "r2" }, 501));

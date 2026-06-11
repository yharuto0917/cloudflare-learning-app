import { Hono } from "hono";

const app = new Hono<{ Bindings: Env }>();

app.get("/health", (c) => {
  return c.json({ ok: true, worker: "cf-stack-lab-demos" });
});

export default app;

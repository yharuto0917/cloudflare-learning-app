import { Hono } from "hono";
import { cors } from "hono/cors";
import { doRoutes } from "./routes/do";

// Durable Object クラスは Worker のエントリから export する必要がある(wrangler が解決する)。
export { Counter } from "./durable-objects/counter";
export { ChatRoom } from "./durable-objects/chat-room";
export { RateLimiter } from "./durable-objects/rate-limiter";
export { AlarmClock } from "./durable-objects/alarm-clock";

const app = new Hono<{ Bindings: Env }>();

// CORS: ALLOWED_ORIGINS に列挙した Origin のみ許可(web アプリからの fetch を想定)。
app.use(
  "/*",
  cors({
    origin: (origin, c) => {
      const allowedOrigins = (c.env as Env).ALLOWED_ORIGINS;
      const allowed = allowedOrigins.split(",").map((o) => o.trim());
      return allowed.includes(origin) ? origin : null;
    },
    allowMethods: ["GET", "POST", "OPTIONS"],
    allowHeaders: ["Content-Type", "x-demo-vid"],
  })
);

app.get("/health", (c) => {
  return c.json({ ok: true, worker: "cf-stack-lab-demos" });
});

app.route("/do", doRoutes);

export default app;

import { Hono } from "hono";
import type { Context } from "hono";

/** chat ルームは固定の2部屋のみ許可(任意のルーム乱立を防ぐ)。 */
const ALLOWED_ROOMS = new Set(["lobby", "random"]);

/** vid は x-demo-vid ヘッダ優先、無ければ ?vid、それも無ければ "anonymous"。 */
function getVid(c: Context<{ Bindings: Env }>): string {
  return (c.req.header("x-demo-vid") ?? c.req.query("vid") ?? "anonymous").slice(0, 64);
}

function clamp(n: number, min: number, max: number): number {
  if (Number.isNaN(n)) return min;
  return Math.min(max, Math.max(min, Math.floor(n)));
}

/** Origin が ALLOWED_ORIGINS に含まれるか(WS Upgrade の手動チェック用)。 */
function isAllowedOrigin(c: Context<{ Bindings: Env }>): boolean {
  const origin = c.req.header("Origin");
  if (!origin) return true; // 非ブラウザ(wscat 等)は Origin を送らないため許可
  const allowed = c.env.ALLOWED_ORIGINS.split(",").map((o) => o.trim());
  return allowed.includes(origin);
}

export const doRoutes = new Hono<{ Bindings: Env }>();

// ---- Counter(グローバル単一インスタンス) ----
doRoutes.get("/counter", async (c) => {
  const value = await c.env.COUNTER.getByName("global").get();
  return c.json({ value });
});

doRoutes.post("/counter/increment", async (c) => {
  const by = clamp(Number((await c.req.json().catch(() => ({})))?.by ?? 1), 1, 10);
  const value = await c.env.COUNTER.getByName("global").increment(by);
  return c.json({ value, by });
});

doRoutes.post("/counter/decrement", async (c) => {
  const by = clamp(Number((await c.req.json().catch(() => ({})))?.by ?? 1), 1, 10);
  const value = await c.env.COUNTER.getByName("global").decrement(by);
  return c.json({ value, by });
});

// ---- RateLimiter(利用者ごと) ----
doRoutes.post("/ratelimit/check", async (c) => {
  const body = (await c.req.json().catch(() => ({}))) as {
    key?: string;
    limit?: number;
    windowSec?: number;
  };
  const key = (body.key ?? "default").slice(0, 64);
  const limit = clamp(Number(body.limit ?? 5), 1, 100);
  const windowSec = clamp(Number(body.windowSec ?? 10), 1, 3600);
  const result = await c.env.RATE_LIMITER.getByName(getVid(c)).check(key, limit, windowSec);
  return c.json(result, result.allowed ? 200 : 429);
});

doRoutes.get("/ratelimit/state", async (c) => {
  const windows = await c.env.RATE_LIMITER.getByName(getVid(c)).state();
  return c.json({ windows });
});

// ---- AlarmClock(利用者ごと) ----
doRoutes.post("/alarm/schedule", async (c) => {
  const seconds = Number((await c.req.json().catch(() => ({})))?.seconds ?? 5);
  const result = await c.env.ALARM_CLOCK.getByName(getVid(c)).schedule(seconds);
  return c.json(result);
});

doRoutes.get("/alarm/status", async (c) => {
  const status = await c.env.ALARM_CLOCK.getByName(getVid(c)).status();
  return c.json(status);
});

doRoutes.post("/alarm/cancel", async (c) => {
  const result = await c.env.ALARM_CLOCK.getByName(getVid(c)).cancel();
  return c.json(result);
});

// ---- ChatRoom(ルームごと、WebSocket Hibernation) ----
doRoutes.get("/chat/:room/ws", async (c) => {
  const room = c.req.param("room");
  if (!ALLOWED_ROOMS.has(room)) {
    return c.json({ error: "unknown_room", allowed: [...ALLOWED_ROOMS] }, 404);
  }
  if (c.req.header("Upgrade")?.toLowerCase() !== "websocket") {
    return c.json({ error: "expected_websocket_upgrade" }, 426);
  }
  if (!isAllowedOrigin(c)) {
    return c.json({ error: "origin_not_allowed" }, 403);
  }
  // Upgrade は RPC では扱えないため、原リクエストを DO の fetch へ転送する。
  return c.env.CHAT_ROOM.getByName(room).fetch(c.req.raw);
});

doRoutes.get("/chat/:room/info", async (c) => {
  const room = c.req.param("room");
  if (!ALLOWED_ROOMS.has(room)) {
    return c.json({ error: "unknown_room", allowed: [...ALLOWED_ROOMS] }, 404);
  }
  const count = await c.env.CHAT_ROOM.getByName(room).count();
  return c.json({ room, count });
});

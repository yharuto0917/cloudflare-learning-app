import { Hono } from "hono";
import type { AppEnv } from "@/lib/vid";
import { requireVid } from "@/lib/vid";
import { passthrough } from "@/server/proxy";

/**
 * Durable Objects デモ。demos worker の `/do/*` へ vid を付けてパススルーする。
 * (WebSocket(/do/chat/:room/ws)は service binding 経由で upgrade できないため、
 *  UI からは demos worker の公開ホストへ直接接続する。ここでは HTTP のみ中継。)
 */
export const doRoutes = new Hono<AppEnv>();

doRoutes.use("*", requireVid);
doRoutes.all("/*", (c) => passthrough(c, "/api/demos/do", "/do"));

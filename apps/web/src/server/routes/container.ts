import { Hono } from "hono";
import type { AppEnv } from "@/lib/vid";
import { requireVid } from "@/lib/vid";
import { passthrough } from "@/server/proxy";

/**
 * Containers デモ。demos worker の `/container/*` へ vid を付けてパススルーする。
 */
export const containerRoutes = new Hono<AppEnv>();

containerRoutes.use("*", requireVid);
containerRoutes.all("/*", (c) => passthrough(c, "/api/demos/container", "/container"));

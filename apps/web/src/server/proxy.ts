import type { Context } from "hono";
import { demosFetch } from "@/lib/demos-client";
import type { AppEnv } from "@/lib/vid";

/**
 * demos worker への汎用パススルー。`x-demo-vid` を付与して元のメソッド/ボディ/クエリを転送する。
 *
 * @param mountPrefix  この web ルーターのマウント先(例: "/api/demos/do")
 * @param demosBase    demos worker 側の対応ベース(例: "/do")
 */
export async function passthrough(
  c: Context<AppEnv>,
  mountPrefix: string,
  demosBase: string
): Promise<Response> {
  const vid = c.get("vid");
  const url = new URL(c.req.url);
  const subpath = url.pathname.startsWith(mountPrefix)
    ? url.pathname.slice(mountPrefix.length)
    : url.pathname;
  const target = `${demosBase}${subpath}${url.search}`;

  const headers: Record<string, string> = { "x-demo-vid": vid };
  const contentType = c.req.header("Content-Type");
  if (contentType) headers["Content-Type"] = contentType;

  const init: RequestInit = { method: c.req.method, headers };
  if (c.req.method !== "GET" && c.req.method !== "HEAD") {
    init.body = await c.req.arrayBuffer();
  }

  try {
    const res = await demosFetch(c.env, target, init);
    return new Response(res.body, {
      status: res.status,
      headers: { "Content-Type": res.headers.get("Content-Type") ?? "application/json" },
    });
  } catch (err) {
    return c.json({ error: "demos_unavailable", message: String(err) }, 502);
  }
}

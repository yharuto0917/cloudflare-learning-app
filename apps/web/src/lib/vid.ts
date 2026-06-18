import type { Context, MiddlewareHandler } from "hono";
import { parseVidCookie } from "@/lib/progress";

/** vid の最大長(demos worker 側の上限 64 と揃える)。 */
export const VID_MAX_LEN = 64;

/**
 * デモ API 共通の Hono 環境型。`requireVid` 通過後は `c.get("vid")` で取得できる。
 * Bindings は OpenNext 生成の CloudflareEnv。
 */
export type AppEnv = {
  Bindings: CloudflareEnv;
  Variables: { vid: string };
};

/** Cookie(cfsl_vid)から vid を取得する。無ければ null。長さは上限でクランプ。 */
export function getVid(c: Context): string | null {
  const vid = parseVidCookie(c.req.header("Cookie") ?? "");
  if (!vid) return null;
  return vid.slice(0, VID_MAX_LEN);
}

/**
 * vid 必須ミドルウェア。Cookie が無ければ 400 を返す。
 * 進捗 Cookie(cfsl_vid)は初回アクセスで付与される想定のため、無い=不正/未初期化とみなす。
 */
export const requireVid: MiddlewareHandler<AppEnv> = async (c, next) => {
  const vid = getVid(c);
  if (!vid) {
    return c.json(
      {
        error: "vid_required",
        message: "vid Cookie(cfsl_vid)が見つかりません。ページを再読み込みしてからお試しください。",
      },
      400
    );
  }
  c.set("vid", vid);
  await next();
};

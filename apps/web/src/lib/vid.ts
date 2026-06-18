import type { Context, MiddlewareHandler } from "hono";
import { parseVidCookie } from "@/lib/progress";

/**
 * vid の許容形式(英数字・`_`・`-` の1〜64文字)。
 * vid は KV(`demo:{vid}:{key}`)/ R2(`demo/{vid}/{name}`)のキー名前空間に使う。Cookie は
 * クライアントが改変可能なため、`:` や `/` を含む細工値で他 vid の prefix に侵入されないよう厳格に検証する。
 */
const VID_RE = /^[A-Za-z0-9_-]{1,64}$/;

/**
 * デモ API 共通の Hono 環境型。`requireVid` 通過後は `c.get("vid")` で取得できる。
 * Bindings は OpenNext 生成の CloudflareEnv。
 */
export type AppEnv = {
  Bindings: CloudflareEnv;
  Variables: { vid: string };
};

/** Cookie(cfsl_vid)から vid を取得する。未設定・許容外文字・長すぎはすべて null。 */
export function getVid(c: Context): string | null {
  const vid = parseVidCookie(c.req.header("Cookie") ?? "");
  if (!vid || !VID_RE.test(vid)) return null;
  return vid;
}

/**
 * vid 必須ミドルウェア。Cookie が無い/不正なら 400 を返す。
 * 進捗 Cookie(cfsl_vid)は初回アクセスで付与される想定のため、無い=未初期化、形式不正=改変とみなす。
 */
export const requireVid: MiddlewareHandler<AppEnv> = async (c, next) => {
  const vid = getVid(c);
  if (!vid) {
    return c.json(
      {
        error: "vid_required",
        message:
          "vid Cookie(cfsl_vid)が見つからないか不正です。ページを再読み込みしてからお試しください。",
      },
      400
    );
  }
  c.set("vid", vid);
  await next();
};

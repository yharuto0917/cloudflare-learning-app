import { Hono } from "hono";
import { revalidateTag } from "next/cache";
import type { AppEnv } from "@/lib/vid";
import { requireVid } from "@/lib/vid";
import { rateLimit } from "@/lib/rate-limit";
import { ISR_TAG } from "@/lib/isr";

/**
 * 雑多なエンドポイント群。
 * - miscRoutes("/"): /health(P3-1 受け入れ条件 /api/health)。/demos 配下にはしない。
 * - demoMiscRoutes("/demos/misc"): request-info / waituntil / revalidate。他デモと URL を揃える。
 */
const WAITUNTIL_DELAY_MS = 1500;
const WAITUNTIL_TTL_SEC = 60;

// ヘルスチェック(P3-1 受け入れ条件: /api/health 応答)
export const miscRoutes = new Hono<AppEnv>();
miscRoutes.get("/health", (c) => c.json({ ok: true }));

export const demoMiscRoutes = new Hono<AppEnv>();

// request.cf を可視化(M1 Workers のデモ)。ローカル(非 CF)では値が無いため null。
demoMiscRoutes.get("/request-info", (c) => {
  const cf = (c.req.raw as { cf?: IncomingRequestCfProperties }).cf;
  return c.json({
    colo: cf?.colo ?? null,
    country: cf?.country ?? null,
    city: cf?.city ?? null,
    region: cf?.region ?? null,
    asn: cf?.asn ?? null,
    asOrganization: cf?.asOrganization ?? null,
    tlsVersion: cf?.tlsVersion ?? null,
    httpProtocol: cf?.httpProtocol ?? null,
    timezone: cf?.timezone ?? null,
  });
});

// 即応答 + ctx.waitUntil で 1.5 秒後に KV 書込。クライアントは /waituntil/:token をポーリング。
demoMiscRoutes.post("/waituntil", (c) => {
  const token = crypto.randomUUID();
  c.executionCtx.waitUntil(
    (async () => {
      await new Promise((resolve) => setTimeout(resolve, WAITUNTIL_DELAY_MS));
      await c.env.DEMO_KV.put(`waituntil:${token}`, JSON.stringify({ doneAt: Date.now() }), {
        expirationTtl: WAITUNTIL_TTL_SEC,
      });
    })()
  );
  return c.json({
    token,
    message: "応答後にバックグラウンドで処理します。token をポーリングしてください。",
  });
});

demoMiscRoutes.get("/waituntil/:token", async (c) => {
  const token = c.req.param("token");
  const raw = await c.env.DEMO_KV.get(`waituntil:${token}`);
  if (!raw) return c.json({ done: false });
  return c.json({ done: true, ...(JSON.parse(raw) as { doneAt: number }) });
});

// ISR タグの on-demand 再検証(3回/分/vid)。
// Next 16 で revalidateTag は (tag, profile) の2引数必須に変更された。profile は再検証後の
// キャッシュ寿命プロファイルで、purge 自体はタグで行われる。ここでは "max" を指定する。
demoMiscRoutes.post("/revalidate", requireVid, rateLimit("revalidate", 3, 60), (c) => {
  revalidateTag(ISR_TAG, "max");
  return c.json({ ok: true, tag: ISR_TAG });
});

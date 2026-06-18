import type { MiddlewareHandler } from "hono";
import { demosFetch } from "@/lib/demos-client";
import type { AppEnv } from "@/lib/vid";

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  limit: number;
  /** demos worker への問い合わせ失敗で fail-open した場合 true。 */
  failOpen?: boolean;
}

/**
 * demos worker の RateLimiter DO に問い合わせて可否を得る。
 *
 * **fail-open**: demos worker が落ちている等で問い合わせ自体に失敗した場合は、
 * デモ全体を止めないために「許可」を返す(warn ログのみ)。レート制限は
 * あくまでデモの保護目的であり、可用性を優先する。
 */
export async function checkRateLimit(
  env: CloudflareEnv,
  vid: string,
  key: string,
  limit: number,
  windowSec: number
): Promise<RateLimitResult> {
  try {
    const res = await demosFetch(env, "/do/ratelimit/check", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-demo-vid": vid },
      body: JSON.stringify({ key, limit, windowSec }),
    });
    // 200(allowed) / 429(denied) いずれも本文に RateLimitResult が入る。
    const data = (await res.json()) as RateLimitResult;
    return data;
  } catch (err) {
    console.warn(`[rate-limit] fail-open (key=${key}):`, err);
    return {
      allowed: true,
      remaining: limit,
      resetAt: Date.now() + windowSec * 1000,
      limit,
      failOpen: true,
    };
  }
}

/**
 * レート制限ミドルウェア。`requireVid` の後に置くこと(vid を前提とする)。
 * 超過時は 429 を返す。
 */
export function rateLimit(
  key: string,
  limit: number,
  windowSec: number
): MiddlewareHandler<AppEnv> {
  return async (c, next) => {
    const vid = c.get("vid");
    const result = await checkRateLimit(c.env, vid, key, limit, windowSec);
    if (!result.allowed) {
      const waitSec = Math.max(0, Math.ceil((result.resetAt - Date.now()) / 1000));
      return c.json(
        {
          error: "rate_limited",
          message: `レート制限に達しました。約 ${waitSec} 秒後に再度お試しください。`,
          ...result,
        },
        429
      );
    }
    await next();
  };
}

import { env } from "cloudflare:test";
import { describe, expect, it } from "vitest";

describe("Counter DO", () => {
  it("increment で加算され、get で現在値が取れる", async () => {
    const counter = env.COUNTER.getByName("test-counter");

    expect(await counter.increment(1)).toBe(1);
    expect(await counter.increment(4)).toBe(5);
    expect(await counter.decrement(2)).toBe(3);
    expect(await counter.get()).toBe(3);
  });

  it("インスタンス名ごとに状態が独立する", async () => {
    const a = env.COUNTER.getByName("counter-a");
    const b = env.COUNTER.getByName("counter-b");

    await a.increment(10);
    expect(await a.get()).toBe(10);
    // b は別インスタンスなので影響を受けない
    expect(await b.get()).toBe(0);
  });
});

describe("RateLimiter DO", () => {
  it("limit を超えると allowed:false になり remaining が減っていく", async () => {
    const limiter = env.RATE_LIMITER.getByName("test-limiter");
    const key = "demo";
    const limit = 2;
    const windowSec = 60;

    const first = await limiter.check(key, limit, windowSec);
    expect(first.allowed).toBe(true);
    expect(first.remaining).toBe(1);

    const second = await limiter.check(key, limit, windowSec);
    expect(second.allowed).toBe(true);
    expect(second.remaining).toBe(0);

    // 上限到達: 3回目は拒否
    const third = await limiter.check(key, limit, windowSec);
    expect(third.allowed).toBe(false);
    expect(third.remaining).toBe(0);

    // state() に1ウィンドウ分の状態が反映されている
    const windows = await limiter.state();
    expect(windows).toHaveLength(1);
    expect(windows[0]).toMatchObject({ key, count: 2, limit });
  });

  it("key が異なれば別ウィンドウとして数える", async () => {
    const limiter = env.RATE_LIMITER.getByName("test-limiter-multikey");

    const a = await limiter.check("key-a", 1, 60);
    expect(a.allowed).toBe(true);
    // key-a は使い切ったが、key-b は別カウント
    const aAgain = await limiter.check("key-a", 1, 60);
    expect(aAgain.allowed).toBe(false);
    const b = await limiter.check("key-b", 1, 60);
    expect(b.allowed).toBe(true);
  });
});

import { SELF } from "cloudflare:test";
import { describe, expect, it } from "vitest";

describe("GET /health", () => {
  it("200 と { ok: true, worker } を返す", async () => {
    const res = await SELF.fetch("https://example.com/health");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true, worker: "cf-stack-lab-demos" });
  });
});

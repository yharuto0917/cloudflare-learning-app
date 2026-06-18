import { describe, expect, it } from "vitest";
import { byteLength, clampInt } from "./util";

describe("clampInt", () => {
  it("範囲内はそのまま整数化する", () => {
    expect(clampInt(30, 1, 100, 5)).toBe(30);
    expect(clampInt("42", 1, 100, 5)).toBe(42);
    expect(clampInt(3.9, 1, 100, 5)).toBe(3); // floor
  });

  it("下限・上限でクランプする", () => {
    expect(clampInt(0, 1, 100, 5)).toBe(1);
    expect(clampInt(9999, 1, 100, 5)).toBe(100);
  });

  it("NaN/非有限値は fallback を返す", () => {
    expect(clampInt("abc", 1, 100, 5)).toBe(5);
    expect(clampInt(undefined, 60, 86400, 3600)).toBe(3600);
    expect(clampInt(Infinity, 1, 100, 5)).toBe(5);
  });
});

describe("byteLength", () => {
  it("ASCII は文字数と一致する", () => {
    expect(byteLength("hello")).toBe(5);
  });

  it("マルチバイトは UTF-8 バイト数で数える", () => {
    expect(byteLength("あ")).toBe(3); // U+3042 = 3 bytes
  });

  it("ArrayBuffer は byteLength を返す", () => {
    expect(byteLength(new ArrayBuffer(16))).toBe(16);
  });
});

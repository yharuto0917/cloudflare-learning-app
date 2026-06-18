import { describe, expect, it } from "vitest";
import { byteLength, clampInt, parseRange } from "./util";

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

describe("parseRange", () => {
  it("bytes=a-b を {offset,length} に変換する", () => {
    expect(parseRange("bytes=0-3")).toEqual({ offset: 0, length: 4 });
    expect(parseRange("bytes=10-19")).toEqual({ offset: 10, length: 10 });
  });

  it("bytes=a- は {offset} のみ(末尾まで)", () => {
    expect(parseRange("bytes=5-")).toEqual({ offset: 5 });
  });

  it("bytes=-N は {suffix}(末尾 N バイト)", () => {
    expect(parseRange("bytes=-100")).toEqual({ suffix: 100 });
  });

  it("未指定・不正・全体指定は undefined(=レンジ無し)", () => {
    expect(parseRange(undefined)).toBeUndefined();
    expect(parseRange("")).toBeUndefined();
    expect(parseRange("bytes=-")).toBeUndefined();
    expect(parseRange("items=0-3")).toBeUndefined();
    expect(parseRange("bytes=abc")).toBeUndefined();
  });
});

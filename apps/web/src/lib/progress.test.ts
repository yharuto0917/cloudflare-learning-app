import { describe, it, expect } from "vitest";
import {
  parseProgressCookie,
  serializeProgressCookie,
  parseVidCookie,
  serializeVidCookie,
  isLessonDone,
  setLessonDone,
  moduleDoneCount,
} from "./progress";

describe("Progress Cookie Parsers and Serializers", () => {
  it("should parse empty cookie correctly", () => {
    expect(parseProgressCookie("")).toEqual({});
    expect(parseProgressCookie("other_cookie=123")).toEqual({});
  });

  it("should parse valid progress cookie", () => {
    const cookie = "cfsl_progress=%7B%22m0%22%3A7%2C%22m1%22%3A1%7D";
    expect(parseProgressCookie(cookie)).toEqual({ m0: 7, m1: 1 });
  });

  it("should serialize progress cookie", () => {
    const progress = { m0: 7, m1: 1 };
    const serialized = serializeProgressCookie(progress);
    expect(serialized).toContain("cfsl_progress=%7B%22m0%22%3A7%2C%22m1%22%3A1%7D");
    expect(serialized).toContain("Path=/");
    expect(serialized).toContain("Max-Age=31536000");
    expect(serialized).toContain("SameSite=Lax");
  });

  it("should parse and serialize vid", () => {
    expect(parseVidCookie("")).toBeNull();
    const vid = "test-uuid-1234";
    const serialized = serializeVidCookie(vid);
    expect(serialized).toContain("cfsl_vid=test-uuid-1234");
    expect(parseVidCookie(serialized)).toBe(vid);
  });
});

describe("Progress Bitmask State Management", () => {
  it("should check if lesson is done", () => {
    const progress = { m0: 5 }; // binary 101 -> lesson index 0 and 2 are done, 1 is not
    expect(isLessonDone(progress, "m0", 0)).toBe(true);
    expect(isLessonDone(progress, "m0", 1)).toBe(false);
    expect(isLessonDone(progress, "m0", 2)).toBe(true);
  });

  it("should set lesson status correctly", () => {
    let progress = {};
    progress = setLessonDone(progress, "m0", 0, true); // mask = 1 (001)
    expect(progress).toEqual({ m0: 1 });

    progress = setLessonDone(progress, "m0", 2, true); // mask = 5 (101)
    expect(progress).toEqual({ m0: 5 });

    progress = setLessonDone(progress, "m0", 0, false); // mask = 4 (100)
    expect(progress).toEqual({ m0: 4 });
  });

  it("should count done lessons for a module excluding drafts", () => {
    // Registry intro (m0) has 3 lessons, none of them are drafts
    const progress = { m0: 5 }; // index 0 and 2 done (5 -> 101)
    expect(moduleDoneCount(progress, "m0")).toBe(2);

    // Registry workers (m1) lessons are all drafts currently. So done count should be 0 even if bits are set.
    const progress2 = { m1: 127 };
    expect(moduleDoneCount(progress2, "m1")).toBe(0);
  });
});

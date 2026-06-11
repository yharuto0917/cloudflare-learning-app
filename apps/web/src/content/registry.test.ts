import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { registry } from "./registry";

describe("Content Registry Validation", () => {
  it("should match 1:1 between registry and MDX files", () => {
    // 1. Get all page.mdx files under src/app/learn
    const learnDir = path.join(__dirname, "..", "app", "learn");

    // Find all files matching src/app/learn/<module-slug>/<lesson-slug>/page.mdx
    const files = fs.readdirSync(learnDir, { recursive: true }) as string[];
    const mdxFiles = files.filter((f) => f.endsWith("page.mdx"));

    // Extract (moduleSlug, lessonSlug) from paths
    // Example: "intro/platform-overview/page.mdx" -> ["intro", "platform-overview"]
    const fileLessons = mdxFiles.map((file) => {
      // Split path and normalize it (handles Windows backslashes just in case)
      const normalizedPath = file.replace(/\\/g, "/");
      const parts = normalizedPath.split("/");
      return {
        moduleSlug: parts[0],
        lessonSlug: parts[1],
      };
    });

    // 2. Get all non-draft lessons from registry
    const registryLessons: { moduleSlug: string; lessonSlug: string }[] = [];
    for (const mod of registry) {
      for (const lesson of mod.lessons) {
        if (!lesson.draft) {
          registryLessons.push({
            moduleSlug: mod.slug,
            lessonSlug: lesson.slug,
          });
        }
      }
    }

    // 3. Compare count and elements
    expect(fileLessons.length).toBe(registryLessons.length);

    for (const reg of registryLessons) {
      const found = fileLessons.some(
        (f) => f.moduleSlug === reg.moduleSlug && f.lessonSlug === reg.lessonSlug
      );
      expect(found).toBe(true);
    }
  });
});

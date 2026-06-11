import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // pnpm モノレポのルートを明示する。
  // 未指定だと Next.js がホーム配下の stray な pnpm-lock.yaml を
  // ワークスペースルートと誤検出して警告を出すため。
  turbopack: {
    root: path.join(__dirname, "..", ".."),
  },
};

export default nextConfig;

// Enable calling `getCloudflareContext()` in `next dev`.
// See https://opennext.js.org/cloudflare/bindings#local-access-to-bindings.
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
initOpenNextCloudflareForDev();

import { defineWorkersConfig } from "@cloudflare/vitest-pool-workers/config";

export default defineWorkersConfig({
  test: {
    poolOptions: {
      workers: {
        // Container を含まないテスト専用設定を参照(P3-4 で wrangler.jsonc に containers が入るため)。
        wrangler: { configPath: "./wrangler.test.jsonc" },
      },
    },
  },
});

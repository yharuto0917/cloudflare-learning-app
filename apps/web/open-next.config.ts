import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import r2IncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/r2-incremental-cache";
import doQueue from "@opennextjs/cloudflare/overrides/queue/do-queue";
import d1NextTagCache from "@opennextjs/cloudflare/overrides/tag-cache/d1-next-tag-cache";

// OpenNext のキャッシュ層を Cloudflare リソースへ委譲する。
// - incrementalCache: R2(NEXT_INC_CACHE_R2_BUCKET)
// - queue: Durable Object(NEXT_CACHE_DO_QUEUE / DOQueueHandler)
// - tagCache: D1(NEXT_TAG_CACHE_D1)
// 各バインディングは wrangler.jsonc で宣言済み。
// https://opennext.js.org/cloudflare/caching
export default defineCloudflareConfig({
  incrementalCache: r2IncrementalCache,
  queue: doQueue,
  tagCache: d1NextTagCache,
});

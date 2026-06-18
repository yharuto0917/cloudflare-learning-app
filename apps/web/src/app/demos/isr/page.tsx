import { unstable_cache } from "next/cache";
import { ISR_TAG } from "@/lib/isr";

// ページを 30 秒ごとに再生成(ISR)。M2 OpenNext のキャッシュスタック(R2 incremental + D1 tag)を実機検証する。
export const revalidate = 30;

/**
 * demo-isr タグ付きでタイムスタンプをキャッシュする。
 * - 時間ベース: revalidate=30 で 30 秒ごとに更新。
 * - on-demand: POST /api/demos/revalidate が revalidateTag("demo-isr") で即時失効させる。
 */
const getCachedTimestamp = unstable_cache(
  async () => ({ generatedAt: new Date().toISOString() }),
  ["demo-isr-timestamp"],
  { tags: [ISR_TAG], revalidate: 30 }
);

export default async function IsrDemoPage() {
  const { generatedAt } = await getCachedTimestamp();

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:py-16">
      <p className="mb-3 text-sm font-medium text-accent">M2 OpenNext / ISR デモ</p>
      <h1 className="text-3xl font-bold tracking-tight text-neutral-50">
        Incremental Static Regeneration
      </h1>
      <p className="mt-4 text-base leading-relaxed text-neutral-400">
        このページは <code className="text-neutral-200">export const revalidate = 30</code> により
        30 秒ごとに再生成されます。下のタイムスタンプはキャッシュされた値で、リロードしても
        再生成タイミングまで変わりません。
      </p>

      <div className="mt-8 rounded-xl border border-neutral-800 bg-neutral-900/50 p-6">
        <p className="text-xs uppercase tracking-wide text-neutral-500">キャッシュ生成時刻(UTC)</p>
        <p className="mt-2 font-mono text-2xl text-neutral-50">{generatedAt}</p>
      </div>

      <ul className="mt-8 space-y-2 text-sm text-neutral-400">
        <li>
          • 時間ベース: 生成から 30 秒経過後の最初のアクセスで、バックグラウンド再生成されます。
        </li>
        <li>
          • on-demand: <code className="text-neutral-200">POST /api/demos/revalidate</code> を叩くと{" "}
          <code className="text-neutral-200">revalidateTag(&quot;{ISR_TAG}&quot;)</code> により
          次のアクセスで即時に新しい値へ更新されます(3回/分)。
        </li>
        <li>
          • キャッシュ実体は R2(incremental cache)+ D1(tag cache)。デプロイ後のステージングで
          初めて実スタックが効きます。
        </li>
      </ul>
    </div>
  );
}

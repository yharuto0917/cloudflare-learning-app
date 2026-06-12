import Link from "next/link";
import { registry, firstLessonHref } from "../content/registry";
import { ModuleCard } from "../components/layout/module-card";
import { OverallProgress } from "../components/layout/overall-progress";

export default function Home() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:py-16">
      {/* ヒーロー */}
      <section className="mx-auto max-w-3xl text-center">
        <p className="mb-3 text-sm font-medium text-accent">Cloudflare スタック徹底学習</p>
        <h1 className="text-balance text-4xl font-bold tracking-tight text-neutral-50 sm:text-5xl">
          読んで・触って学ぶ
          <br />
          Cloudflare 開発者プラットフォーム
        </h1>
        <p className="mt-5 text-balance text-base leading-relaxed text-neutral-400 sm:text-lg">
          Workers / OpenNext / D1 / R2 / KV / Durable Objects / Containers / Flagship。
          このサイト自体が Cloudflare 上で動く教材です。各デモは本物のサービスを実際に叩きます。
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <Link
            href={firstLessonHref()}
            className="rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-black transition-opacity hover:opacity-90"
          >
            学習を始める
          </Link>
          <a
            href="https://developers.cloudflare.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg border border-neutral-700 px-5 py-2.5 text-sm font-medium text-neutral-300 transition-colors hover:border-neutral-500 hover:text-neutral-100"
          >
            公式ドキュメント
          </a>
        </div>
      </section>

      {/* 全体進捗 */}
      <section className="mx-auto mt-14 max-w-3xl">
        <OverallProgress />
      </section>

      {/* モジュール一覧 */}
      <section className="mt-12">
        <h2 className="mb-5 text-lg font-semibold text-neutral-200">カリキュラム</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {registry.map((module) => (
            <ModuleCard key={module.id} module={module} />
          ))}
        </div>
      </section>
    </div>
  );
}

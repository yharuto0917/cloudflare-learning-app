import Link from "next/link";
import { lessonHref } from "../content/registry";

export default function NotFound() {
  return (
    <div className="grid min-h-[60vh] place-items-center px-4">
      <div className="text-center">
        <p className="text-6xl font-bold text-accent">404</p>
        <h1 className="mt-4 text-2xl font-semibold text-neutral-100">ページが見つかりません</h1>
        <p className="mt-2 text-sm text-neutral-400">
          お探しのページは存在しないか、移動した可能性があります。
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <Link
            href="/"
            className="rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-black transition-opacity hover:opacity-90"
          >
            ホームへ戻る
          </Link>
          <Link
            href={lessonHref("intro", "platform-overview")}
            className="rounded-lg border border-neutral-700 px-5 py-2.5 text-sm font-medium text-neutral-300 transition-colors hover:border-neutral-500 hover:text-neutral-100"
          >
            学習を始める
          </Link>
        </div>
      </div>
    </div>
  );
}

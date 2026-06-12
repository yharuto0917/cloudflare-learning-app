"use client";

import { useProgress } from "../../hooks/use-progress";

export function OverallProgress() {
  const { overall } = useProgress();

  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-5">
      <div className="mb-2 flex items-baseline justify-between">
        <h2 className="text-sm font-semibold text-neutral-300">全体の進捗</h2>
        <span className="text-sm tabular-nums text-neutral-400">
          {overall.done} / {overall.total} レッスン完了
        </span>
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-neutral-800">
        <div
          className="h-full rounded-full bg-accent transition-[width] duration-500 ease-out"
          style={{ width: `${overall.percentage}%` }}
        />
      </div>
    </div>
  );
}

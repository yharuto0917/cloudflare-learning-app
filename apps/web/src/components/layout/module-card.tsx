"use client";

import Link from "next/link";
import { useProgress } from "../../hooks/use-progress";
import { lessonHref, type Module } from "../../content/registry";
import { ProgressRing } from "./progress-ring";

export function ModuleCard({ module }: { module: Module }) {
  const { moduleProgress } = useProgress();
  const stats = moduleProgress(module.id);

  const firstPublished = module.lessons.find((l) => !l.draft);
  const isReady = firstPublished !== undefined;

  const inner = (
    <>
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-semibold text-neutral-100">{module.title}</h3>
        {isReady ? (
          <ProgressRing percentage={stats.percentage} />
        ) : (
          <span className="shrink-0 rounded border border-neutral-700 px-2 py-0.5 text-[10px] font-medium text-neutral-500">
            準備中
          </span>
        )}
      </div>
      <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-neutral-400">
        {module.description}
      </p>
      <p className="mt-4 text-xs text-neutral-500">
        {isReady ? `${stats.total} レッスン` : `${module.lessons.length} レッスン（準備中）`}
      </p>
    </>
  );

  if (!isReady) {
    return (
      <div className="cursor-not-allowed rounded-xl border border-neutral-800 bg-neutral-900/20 p-5 opacity-60">
        {inner}
      </div>
    );
  }

  return (
    <Link
      href={lessonHref(module.slug, firstPublished.slug)}
      className="group rounded-xl border border-neutral-800 bg-neutral-900/40 p-5 transition-all hover:border-accent/50 hover:bg-neutral-900/70"
    >
      {inner}
    </Link>
  );
}

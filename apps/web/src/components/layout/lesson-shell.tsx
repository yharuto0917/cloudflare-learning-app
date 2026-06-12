"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { findLesson, prevNext } from "../../content/registry";
import { useProgress } from "../../hooks/use-progress";

export function LessonShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { isDone, toggle } = useProgress();

  const info = pathname ? findLesson(pathname) : null;

  // レッスン以外(将来の learn 直下インデックス等)では本文をそのまま描画
  if (!info) {
    return <div className="min-w-0 flex-1 px-4 py-10">{children}</div>;
  }

  const { module, lesson, lessonIndex } = info;
  const done = isDone(module.id, lessonIndex);
  const { prev, next } = prevNext(module.slug, lesson.slug);

  return (
    <div className="min-w-0 flex-1 px-4 py-10 lg:px-10">
      <div className="mx-auto max-w-3xl">
        {/* パンくず */}
        <nav className="mb-4 flex flex-wrap items-center gap-1.5 text-xs text-neutral-500">
          <Link href="/" className="hover:text-neutral-300">
            ホーム
          </Link>
          <span>/</span>
          <span className="text-neutral-400">{module.title}</span>
          <span>/</span>
          <span className="text-neutral-300">{lesson.title}</span>
          {lesson.demo && (
            <span className="ml-1 rounded bg-neutral-800 px-1.5 py-0.5 text-[10px] font-medium text-neutral-400">
              デモ
            </span>
          )}
        </nav>

        {/* タイトル(registry が単一ソース。MDX には h1 を書かない) */}
        <h1 className="mb-8 text-3xl font-bold tracking-tight text-neutral-50">{lesson.title}</h1>

        {/* 本文(MDX) */}
        <article className="text-neutral-300 [&_h2]:mt-10 [&_h2]:mb-3 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-neutral-100 [&_h3]:mt-6 [&_h3]:mb-2 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-neutral-100 [&_p]:my-4 [&_p]:leading-relaxed [&_ul]:my-4 [&_ul]:list-disc [&_ul]:pl-6 [&_li]:my-1 [&_a]:text-accent [&_a]:underline [&_a]:underline-offset-2 [&_code]:rounded [&_code]:bg-neutral-800 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:text-sm [&_code]:text-neutral-200">
          {children}
        </article>

        {/* 完了トグル */}
        <div className="mt-12 flex justify-center border-t border-neutral-800 pt-8">
          <button
            onClick={() => toggle(module.id, lessonIndex)}
            className={`rounded-lg border px-5 py-2.5 text-sm font-semibold transition-all cursor-pointer ${
              done
                ? "border-accent bg-accent/10 text-accent"
                : "border-neutral-700 text-neutral-300 hover:border-neutral-500 hover:text-neutral-100"
            }`}
          >
            {done ? "✓ 完了済み（クリックで未完了に戻す）" : "このレッスンを完了にする"}
          </button>
        </div>

        {/* prev / next */}
        <div className="mt-8 grid grid-cols-2 gap-4">
          {prev ? (
            <Link
              href={prev.href}
              className="group flex flex-col rounded-lg border border-neutral-800 p-4 transition-colors hover:border-neutral-600"
            >
              <span className="text-xs text-neutral-500">← 前のレッスン</span>
              <span className="mt-1 text-sm text-neutral-300 group-hover:text-neutral-100">
                {prev.title}
              </span>
            </Link>
          ) : (
            <div />
          )}
          {next ? (
            <Link
              href={next.href}
              className="group flex flex-col rounded-lg border border-neutral-800 p-4 text-right transition-colors hover:border-neutral-600"
            >
              <span className="text-xs text-neutral-500">次のレッスン →</span>
              <span className="mt-1 text-sm text-neutral-300 group-hover:text-neutral-100">
                {next.title}
              </span>
            </Link>
          ) : (
            <div />
          )}
        </div>
      </div>
    </div>
  );
}

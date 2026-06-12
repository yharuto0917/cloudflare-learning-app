"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { registry, lessonHref } from "../../content/registry";
import { useProgress } from "../../hooks/use-progress";
import { useSidebar } from "./sidebar-provider";

// モジュール→レッスンのツリー本体。デスクトップ常設・モバイルドロワーの両方で使い回す。
function NavTree({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { isDone, ready } = useProgress();

  return (
    <nav className="space-y-6 p-4">
      {registry.map((module) => (
        <div key={module.id}>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-neutral-500">
            {module.title}
          </p>
          <ul className="space-y-0.5">
            {module.lessons.map((lesson, index) => {
              if (lesson.draft) {
                return (
                  <li key={lesson.slug}>
                    <span className="flex cursor-not-allowed items-center justify-between rounded px-3 py-1.5 text-sm text-neutral-600">
                      <span className="truncate">{lesson.title}</span>
                      <span className="ml-2 shrink-0 text-[10px] text-neutral-700">準備中</span>
                    </span>
                  </li>
                );
              }

              const href = lessonHref(module.slug, lesson.slug);
              const isActive = pathname === href;
              // hydration 完了まで未完了で描画(SSR との不整合回避)
              const done = ready && isDone(module.id, index);

              return (
                <li key={lesson.slug}>
                  <Link
                    href={href}
                    onClick={onNavigate}
                    className={`flex items-center justify-between gap-2 rounded px-3 py-1.5 text-sm transition-colors ${
                      isActive
                        ? "bg-accent/10 font-medium text-accent"
                        : "text-neutral-400 hover:bg-neutral-800/50 hover:text-neutral-100"
                    }`}
                  >
                    <span className="flex min-w-0 items-center gap-1.5">
                      <span
                        className={`shrink-0 text-xs ${done ? "text-accent" : "text-neutral-700"}`}
                      >
                        {done ? "✓" : "○"}
                      </span>
                      <span className="truncate">{lesson.title}</span>
                    </span>
                    {lesson.demo && (
                      <span className="shrink-0 rounded bg-neutral-800 px-1.5 py-0.5 text-[10px] font-medium text-neutral-400">
                        デモ
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

export function SidebarNav() {
  const { open, close } = useSidebar();

  return (
    <>
      {/* デスクトップ: 常設サイドバー */}
      <aside className="sticky top-14 hidden h-[calc(100vh-3.5rem)] w-72 shrink-0 overflow-y-auto border-r border-neutral-800 lg:block">
        <NavTree />
      </aside>

      {/* モバイル: ドロワー(open 時のみ) */}
      {open && (
        <>
          <div
            onClick={close}
            aria-hidden="true"
            className="fixed inset-0 top-14 z-40 bg-black/60 lg:hidden"
          />
          <aside className="fixed bottom-0 left-0 top-14 z-50 w-72 overflow-y-auto border-r border-neutral-800 bg-neutral-950 lg:hidden">
            <NavTree onNavigate={close} />
          </aside>
        </>
      )}
    </>
  );
}

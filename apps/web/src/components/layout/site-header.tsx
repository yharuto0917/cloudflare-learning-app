"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSidebar } from "./sidebar-provider";

export function SiteHeader() {
  const pathname = usePathname();
  const { toggle } = useSidebar();
  const isLearn = pathname?.startsWith("/learn") ?? false;

  return (
    <header className="sticky top-0 z-50 h-14 border-b border-neutral-800 bg-neutral-950/80 backdrop-blur-md">
      <div className="mx-auto flex h-full max-w-7xl items-center gap-3 px-4">
        {/* learn 配下でのみ、モバイルでサイドバードロワーを開くハンバーガー */}
        {isLearn && (
          <button
            onClick={toggle}
            aria-label="ナビゲーションを開く"
            className="-ml-1 rounded p-2 text-neutral-400 hover:bg-neutral-800 hover:text-neutral-100 lg:hidden"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
        )}

        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <span className="grid h-7 w-7 place-items-center rounded bg-accent text-sm font-bold text-black">
            CF
          </span>
          <span className="text-neutral-100">Cloudflare Stack Lab</span>
        </Link>

        <nav className="ml-auto flex items-center gap-4 text-sm">
          <Link
            href="/learn/intro/platform-overview"
            className="text-neutral-400 transition-colors hover:text-neutral-100"
          >
            学習を始める
          </Link>
        </nav>
      </div>
    </header>
  );
}

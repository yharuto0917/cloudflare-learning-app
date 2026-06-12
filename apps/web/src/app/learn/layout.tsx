import type { ReactNode } from "react";
import { SidebarNav } from "../../components/layout/sidebar-nav";
import { LessonShell } from "../../components/layout/lesson-shell";

// server component のまま children(SSG 済み MDX)をパススルーし、静的生成を維持する。
export default function LearnLayout({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto flex w-full max-w-7xl">
      <SidebarNav />
      <LessonShell>{children}</LessonShell>
    </div>
  );
}

"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { ReactNode } from "react";

interface SidebarContextType {
  open: boolean;
  toggle: () => void;
  close: () => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

// モバイルのサイドバードロワー開閉を管理する。
// SiteHeader(ハンバーガー)と SidebarNav(本体)が別ツリーのため、
// root layout で両者を含む位置に Provider を置いて状態を共有する。
// open は useState のみで管理し、effect 内の setState は使わない
// (react-hooks/set-state-in-effect 回避。閉じる操作は onClick で行う)。
export function SidebarProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const toggle = useCallback(() => setOpen((v) => !v), []);
  const close = useCallback(() => setOpen(false), []);
  const value = useMemo(() => ({ open, toggle, close }), [open, toggle, close]);
  return <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>;
}

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (context === undefined) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
}

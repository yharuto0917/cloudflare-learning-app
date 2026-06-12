"use client";

import { Children, isValidElement, useState, type ReactElement, type ReactNode } from "react";

interface CodeTabsProps {
  children: ReactNode;
}

export function CodeTabs({ children }: CodeTabsProps) {
  const tabs = Children.toArray(children).filter(
    (child): child is ReactElement<{ label?: string }> => isValidElement(child)
  );

  const [activeIdx, setActiveIdx] = useState(0);

  if (tabs.length === 0) return null;

  // HMR で MDX からタブが減ると state の index が範囲外に残るため 0 に戻す
  const safeIdx = activeIdx < tabs.length ? activeIdx : 0;

  return (
    <div className="my-6 rounded-lg border border-neutral-800 bg-neutral-950 overflow-hidden">
      <div className="flex border-b border-neutral-800 bg-neutral-900/50 px-2">
        {tabs.map((tab, idx) => {
          const label = tab.props.label || `Tab ${idx + 1}`;
          const isActive = idx === safeIdx;
          return (
            <button
              key={idx}
              onClick={() => setActiveIdx(idx)}
              className={`px-4 py-2.5 text-xs font-medium border-b-2 transition-all cursor-pointer ${
                isActive
                  ? "border-orange-500 text-orange-400"
                  : "border-transparent text-neutral-400 hover:text-neutral-200"
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>
      <div className="p-0 text-sm leading-relaxed">{tabs[safeIdx]}</div>
    </div>
  );
}

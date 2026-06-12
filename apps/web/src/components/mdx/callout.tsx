import type { ReactNode } from "react";

interface CalloutProps {
  type?: "info" | "warn" | "tip" | "danger";
  title?: string;
  children: ReactNode;
}

const styles = {
  info: {
    bg: "bg-blue-500/10",
    border: "border-blue-500/30",
    text: "text-blue-200",
    icon: "ℹ️",
    titleColor: "text-blue-400",
  },
  warn: {
    bg: "bg-amber-500/10",
    border: "border-amber-500/30",
    text: "text-amber-200",
    icon: "⚠️",
    titleColor: "text-amber-400",
  },
  tip: {
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/30",
    text: "text-emerald-200",
    icon: "💡",
    titleColor: "text-emerald-400",
  },
  danger: {
    bg: "bg-rose-500/10",
    border: "border-rose-500/30",
    text: "text-rose-200",
    icon: "🛑",
    titleColor: "text-rose-400",
  },
} as const;

export function Callout({ type = "info", title, children }: CalloutProps) {
  // MDX からは型チェックなしで渡るため、未知の type は info に落とす
  const style = styles[type] ?? styles.info;

  return (
    <div
      className={`my-6 p-4 rounded-lg border ${style.bg} ${style.border} ${style.text} flex gap-3`}
    >
      <span className="text-lg leading-none select-none">{style.icon}</span>
      <div className="flex-1 space-y-1">
        {title && <h5 className={`font-semibold ${style.titleColor} text-sm`}>{title}</h5>}
        <div className="text-sm leading-relaxed">{children}</div>
      </div>
    </div>
  );
}

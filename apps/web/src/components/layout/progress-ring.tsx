interface ProgressRingProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
}

// SVG の円弧で進捗を表す純表示コンポーネント。
// stroke-dashoffset を percentage に応じて動かし、CSS transition で滑らかに埋める。
export function ProgressRing({ percentage, size = 44, strokeWidth = 4 }: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - Math.min(Math.max(percentage, 0), 100) / 100);

  return (
    <div
      className="relative inline-flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-neutral-800"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="text-accent transition-[stroke-dashoffset] duration-500 ease-out"
        />
      </svg>
      <span className="absolute text-[10px] font-semibold tabular-nums text-neutral-300">
        {Math.round(percentage)}%
      </span>
    </div>
  );
}

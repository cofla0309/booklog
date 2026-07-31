import { useChartTooltip } from "../../hooks/useChartTooltip";
import { ChartTooltip } from "./ChartTooltip";
import { fmt } from "../../lib/svgChartHelpers";

const HEAT_STEPS = [
  "var(--surface-2)",
  "var(--seq-100)",
  "var(--seq-250)",
  "var(--seq-400)",
  "var(--seq-550)",
  "var(--seq-700)",
];

interface YearHeatmapProps {
  year: number;
  values: Record<string, number>;
  unit?: string;
}

export function YearHeatmap({ year, values, unit = "p" }: YearHeatmapProps) {
  const { state, show, hide } = useChartTooltip();

  const nums = Object.values(values).filter((v) => v > 0);
  const cell = 11;
  const gap = 2;
  const step = cell + gap;

  const start = new Date(year, 0, 1);
  const end = new Date(year, 11, 31);
  const offset = start.getDay();
  const totalDays = Math.round((end.getTime() - start.getTime()) / 86_400_000) + 1;
  const weeks = Math.ceil((offset + totalDays) / 7);

  const padL = 26;
  const padT = 16;
  const w = padL + weeks * step;
  const h = padT + 7 * step + 4;

  const max = nums.length ? Math.max(...nums) : 0;
  const level = (v: number) => {
    if (!v || v <= 0) return 0;
    if (!max) return 1;
    return Math.min(5, 1 + Math.floor((v / max) * 4.999));
  };

  const dayNames = ["일", "", "화", "", "목", "", "토"];

  const cells: { x: number; y: number; key: string; v: number }[] = [];
  const monthLabels: { x: number; text: string }[] = [];
  let lastMonth = -1;
  for (let d = 0; d < totalDays; d++) {
    const date = new Date(year, 0, 1 + d);
    const idx = offset + d;
    const col = Math.floor(idx / 7);
    const row = idx % 7;
    const key = `${year}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    cells.push({ x: padL + col * step, y: padT + row * step, key, v: values[key] || 0 });

    if (date.getMonth() !== lastMonth && date.getDate() <= 7) {
      lastMonth = date.getMonth();
      monthLabels.push({ x: padL + col * step, text: `${lastMonth + 1}월` });
    }
  }

  return (
    <div className="chart">
      <svg viewBox={`0 0 ${w} ${h}`} width={w} height={h} preserveAspectRatio="xMinYMin meet">
        {dayNames.map((name, i) =>
          name ? (
            <text key={i} className="tick" x={padL - 6} y={padT + i * step + cell - 1} textAnchor="end">
              {name}
            </text>
          ) : null,
        )}
        {monthLabels.map((m, i) => (
          <text key={i} className="tick" x={m.x} y={padT - 5}>
            {m.text}
          </text>
        ))}
        {cells.map((c) => (
          <rect
            key={c.key}
            className="cell"
            x={c.x}
            y={c.y}
            width={cell}
            height={cell}
            fill={HEAT_STEPS[level(c.v)]}
            onMouseMove={(e) => show(`${c.key}: ${c.v ? `${fmt(c.v)}${unit}` : "기록 없음"}`, e)}
            onMouseLeave={hide}
          />
        ))}
      </svg>
      <ChartTooltip state={state} />
    </div>
  );
}

export function HeatLegend() {
  return (
    <span className="heat-legend">
      <span>적음</span>
      {HEAT_STEPS.map((c) => (
        <span key={c} className="sw" style={{ background: c }} />
      ))}
      <span>많음</span>
    </span>
  );
}

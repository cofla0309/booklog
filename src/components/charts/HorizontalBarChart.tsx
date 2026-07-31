import type { ReactNode } from "react";
import { barPathRight, fmt } from "../../lib/svgChartHelpers";
import { useChartTooltip } from "../../hooks/useChartTooltip";
import { ChartTooltip } from "./ChartTooltip";

interface HorizontalBarChartProps<T> {
  data: T[];
  value: (d: T) => number;
  label: (d: T) => string;
  unit?: string;
  rowH?: number;
  tooltip?: (d: T) => ReactNode;
}

export function HorizontalBarChart<T>({
  data,
  value,
  label,
  unit = "",
  rowH = 30,
  tooltip,
}: HorizontalBarChartProps<T>) {
  const { state, show, hide } = useChartTooltip();

  if (data.length === 0) {
    return <div className="empty-state tiny">아직 기록이 없습니다.</div>;
  }

  const padL = 100;
  const padR = 46;
  const padT = 4;
  const padB = 4;
  const w = 520;
  const h = padT + padB + rowH * data.length;
  const plotW = w - padL - padR;
  const max = Math.max(1, ...data.map((d) => value(d) || 0));
  const barH = Math.min(20, rowH - 8);

  return (
    <div className="chart">
      <svg viewBox={`0 0 ${w} ${h}`} width={w} height={h} preserveAspectRatio="xMinYMin meet">
        {data.map((d, i) => {
          const y = padT + rowH * i + (rowH - barH) / 2;
          const v = value(d) || 0;
          const bw = (v / max) * plotW;
          const name = label(d);
          const short = name.length > 9 ? `${name.slice(0, 8)}…` : name;
          return (
            <g key={i}>
              <text className="tick" x={padL - 10} y={y + barH / 2 + 4} textAnchor="end">
                {short}
                <title>{name}</title>
              </text>
              <path className="bar" d={barPathRight(padL, y, bw, barH)} />
              <text className="val-label" x={padL + bw + 8} y={y + barH / 2 + 4}>
                {fmt(v)}
                {unit}
              </text>
              <rect
                className="hit"
                x={0}
                y={padT + rowH * i}
                width={w}
                height={rowH}
                onMouseMove={(e) => show(tooltip ? tooltip(d) : `${name}: ${fmt(v)}${unit}`, e)}
                onMouseLeave={hide}
              />
            </g>
          );
        })}
        <line className="axis-line" x1={padL} x2={padL} y1={padT} y2={h - padB} />
      </svg>
      <ChartTooltip state={state} />
    </div>
  );
}

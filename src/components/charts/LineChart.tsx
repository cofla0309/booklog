import type { ReactNode } from "react";
import { fmt, niceTicks } from "../../lib/svgChartHelpers";
import { useChartTooltip } from "../../hooks/useChartTooltip";
import { ChartTooltip } from "./ChartTooltip";

export interface LinePoint {
  x: string;
  y: number;
}

interface LineChartProps {
  points: LinePoint[];
  height?: number;
  unit?: string;
  total?: number | null;
  tooltip?: (p: LinePoint) => ReactNode;
}

export function LineChart({ points, height = 180, unit = "p", total = null, tooltip }: LineChartProps) {
  const { state, show, hide } = useChartTooltip();

  if (points.length < 1) {
    return <div className="empty-state tiny">진도 기록이 쌓이면 그래프가 나옵니다.</div>;
  }

  const padL = 46;
  const padR = 44;
  const padT = 14;
  const padB = 26;
  const w = 620;
  const h = height;
  const plotW = w - padL - padR;
  const plotH = h - padT - padB;

  const maxY = Math.max(total || 0, ...points.map((p) => p.y), 1);
  const ticks = niceTicks(maxY, 3);
  const top = ticks[ticks.length - 1];
  const n = Math.max(1, points.length - 1);
  const xOf = (i: number) => padL + (n === 0 ? plotW / 2 : (i / n) * plotW);
  const yOf = (v: number) => padT + plotH - (v / top) * plotH;

  const linePath = points.map((p, i) => `${i ? "L" : "M"}${xOf(i)},${yOf(p.y)}`).join(" ");
  const areaPath =
    points.length > 1
      ? `${linePath} L${xOf(points.length - 1)},${yOf(0)} L${xOf(0)},${yOf(0)} Z`
      : "";
  const last = points[points.length - 1];

  return (
    <div className="chart">
      <svg viewBox={`0 0 ${w} ${h}`} width={w} height={h} preserveAspectRatio="xMinYMin meet">
        {ticks.map((t) => (
          <g key={t}>
            <line className="grid-line" x1={padL} x2={padL + plotW} y1={yOf(t)} y2={yOf(t)} />
            <text className="tick" x={padL - 8} y={yOf(t) + 4} textAnchor="end">
              {fmt(t)}
            </text>
          </g>
        ))}

        {areaPath && <path className="area" d={areaPath} />}
        <path className="line" d={linePath} />

        {points.map((p, i) => (
          <g key={i}>
            <circle className="dot" cx={xOf(i)} cy={yOf(p.y)} r={4} />
            <circle
              className="hit"
              cx={xOf(i)}
              cy={yOf(p.y)}
              r={14}
              onMouseMove={(e) => show(tooltip ? tooltip(p) : `${p.x}: ${fmt(p.y)}${unit}`, e)}
              onMouseLeave={hide}
            />
          </g>
        ))}

        <text className="val-label" x={xOf(points.length - 1) + 9} y={yOf(last.y) + 4}>
          {fmt(last.y)}
          {unit}
        </text>
        <text className="tick" x={padL} y={h - 8}>
          {points[0].x}
        </text>
        {points.length > 1 && (
          <text className="tick" x={padL + plotW} y={h - 8} textAnchor="end">
            {last.x}
          </text>
        )}
      </svg>
      <ChartTooltip state={state} />
    </div>
  );
}

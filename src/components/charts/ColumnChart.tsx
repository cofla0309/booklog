import type { ReactNode } from "react";
import { barPathUp, fmt, niceTicks } from "../../lib/svgChartHelpers";
import { useChartTooltip } from "../../hooks/useChartTooltip";
import { ChartTooltip } from "./ChartTooltip";

interface ColumnChartProps<T> {
  data: T[];
  value: (d: T) => number;
  label: (d: T) => string;
  unit?: string;
  height?: number;
  labelEvery?: number;
  highlightMax?: boolean;
  tooltip?: (d: T) => ReactNode;
}

export function ColumnChart<T>({
  data,
  value,
  label,
  unit = "",
  height = 190,
  labelEvery = 1,
  highlightMax = true,
  tooltip,
}: ColumnChartProps<T>) {
  const { state, show, hide } = useChartTooltip();

  if (data.length === 0 || data.every((d) => !value(d))) {
    return <div className="empty-state tiny">아직 기록이 없습니다.</div>;
  }

  const padL = 44;
  const padR = 12;
  const padT = 16;
  const padB = 26;
  const slot = Math.max(18, Math.min(56, 640 / data.length));
  const w = Math.max(280, padL + padR + slot * data.length);
  const h = height;
  const plotW = w - padL - padR;
  const plotH = h - padT - padB;

  const max = Math.max(...data.map((d) => value(d) || 0));
  const ticks = niceTicks(max);
  const top = ticks[ticks.length - 1] || 1;
  const yOf = (v: number) => padT + plotH - (v / top) * plotH;
  const barW = Math.max(3, Math.min(24, slot - 2));
  const maxIdx = highlightMax ? data.findIndex((d) => value(d) === max) : -1;

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
        <line className="axis-line" x1={padL} x2={padL + plotW} y1={yOf(0)} y2={yOf(0)} />

        {data.map((d, i) => {
          const v = value(d) || 0;
          const cx = padL + slot * i + slot / 2;
          const x = cx - barW / 2;
          const y = yOf(v);
          const bh = yOf(0) - y;
          return (
            <g key={i}>
              <path className={`bar${v ? "" : " muted"}`} d={barPathUp(x, y, barW, bh)} />
              <rect
                className="hit"
                x={padL + slot * i}
                y={padT}
                width={slot}
                height={plotH}
                onMouseMove={(e) =>
                  show(tooltip ? tooltip(d) : `${label(d)}: ${fmt(v)}${unit}`, e)
                }
                onMouseLeave={hide}
              />
              {i % labelEvery === 0 && (
                <text className="tick" x={cx} y={h - 8} textAnchor="middle">
                  {label(d)}
                </text>
              )}
              {i === maxIdx && v > 0 && (
                <text className="val-label" x={cx} y={y - 6} textAnchor="middle">
                  {fmt(v)}
                </text>
              )}
            </g>
          );
        })}
      </svg>
      <ChartTooltip state={state} />
    </div>
  );
}

import type { ReactNode } from "react";
import { barPathUp, fmt, niceTicks } from "../../lib/svgChartHelpers";
import { useChartTooltip } from "../../hooks/useChartTooltip";
import { ChartTooltip } from "./ChartTooltip";

const COLOR_A = "#2a78d6"; // pages — series-1 blue
const COLOR_B = "#d03b3b"; // minutes — critical red

interface DualColumnChartProps<T> {
  data: T[];
  valueA: (d: T) => number;
  valueB: (d: T) => number;
  label: (d: T) => string;
  labelA?: string;
  labelB?: string;
  unitA?: string;
  unitB?: string;
  height?: number;
  labelEvery?: number;
}

export function DualColumnChart<T>({
  data,
  valueA,
  valueB,
  label,
  labelA = "페이지",
  labelB = "시간(분)",
  unitA = "p",
  unitB = "분",
  height = 190,
  labelEvery = 1,
}: DualColumnChartProps<T>) {
  const { state, show, hide } = useChartTooltip();

  if (data.length === 0 || data.every((d) => !valueA(d) && !valueB(d))) {
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

  const maxA = Math.max(...data.map((d) => valueA(d) || 0), 1);
  const maxB = Math.max(...data.map((d) => valueB(d) || 0), 1);
  const ticks = niceTicks(maxA);
  const topA = ticks[ticks.length - 1] || 1;
  const yOfA = (v: number) => padT + plotH - (v / topA) * plotH;
  const yOfB = (v: number) => padT + plotH - (v / maxB) * plotH;

  const pairW = Math.max(4, Math.min(20, slot / 2 - 2));

  return (
    <div className="chart">
      <svg viewBox={`0 0 ${w} ${h}`} width={w} height={h} preserveAspectRatio="xMinYMin meet">
        {ticks.map((t) => (
          <g key={t}>
            <line className="grid-line" x1={padL} x2={padL + plotW} y1={yOfA(t)} y2={yOfA(t)} />
            <text className="tick" x={padL - 8} y={yOfA(t) + 4} textAnchor="end">
              {fmt(t)}
            </text>
          </g>
        ))}
        <line className="axis-line" x1={padL} x2={padL + plotW} y1={yOfA(0)} y2={yOfA(0)} />

        {data.map((d, i) => {
          const a = valueA(d) || 0;
          const b = valueB(d) || 0;
          const cx = padL + slot * i + slot / 2;
          const xA = cx - pairW - 1;
          const xB = cx + 1;
          const yA = yOfA(a);
          const yB = yOfB(b);
          const bhA = yOfA(0) - yA;
          const bhB = yOfA(0) - yB;
          const tooltipContent: ReactNode = (
            <>
              {label(d)}
              <br />
              <span style={{ color: COLOR_A }}>■</span> {fmt(a)}
              {unitA}
              {"  "}
              <span style={{ color: COLOR_B }}>■</span> {fmt(b)}
              {unitB}
            </>
          );
          return (
            <g key={i}>
              <path d={barPathUp(xA, yA, pairW, bhA)} fill={COLOR_A} />
              <path d={barPathUp(xB, yB, pairW, bhB)} fill={COLOR_B} />
              <rect
                className="hit"
                x={padL + slot * i}
                y={padT}
                width={slot}
                height={plotH}
                onMouseMove={(e) => show(tooltipContent, e)}
                onMouseLeave={hide}
              />
              {i % labelEvery === 0 && (
                <text className="tick" x={cx} y={h - 8} textAnchor="middle">
                  {label(d)}
                </text>
              )}
            </g>
          );
        })}
      </svg>
      <div className="legend">
        <span className="key">
          <span className="sw" style={{ background: COLOR_A }} /> {labelA}
        </span>
        <span className="key">
          <span className="sw" style={{ background: COLOR_B }} /> {labelB}
        </span>
      </div>
      <ChartTooltip state={state} />
    </div>
  );
}

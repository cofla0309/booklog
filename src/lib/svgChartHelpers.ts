/** 0 / 50 / 100 처럼 읽기 좋은 눈금. */
export function niceTicks(max: number, count = 4): number[] {
  if (!max || max <= 0) return [0, 1];
  const raw = max / count;
  const mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const norm = raw / mag;
  const step = (norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 2.5 ? 2.5 : norm <= 5 ? 5 : 10) * mag;
  const ticks: number[] = [];
  for (let v = 0; v <= max + step * 0.001; v += step) ticks.push(Math.round(v * 100) / 100);
  if (ticks[ticks.length - 1] < max) ticks.push(ticks[ticks.length - 1] + step);
  return ticks;
}

export const fmt = (n: number) => Number(n).toLocaleString("ko-KR");

/** 위쪽 두 모서리만 둥근 막대. */
export function barPathUp(x: number, y: number, w: number, h: number, r = 4): string {
  if (h <= 0.5) return `M${x},${y + h} h${w} v${-Math.max(h, 0.5)} h${-w} Z`;
  const rr = Math.min(r, w / 2, h);
  return (
    `M${x},${y + h} L${x},${y + rr} Q${x},${y} ${x + rr},${y} ` +
    `L${x + w - rr},${y} Q${x + w},${y} ${x + w},${y + rr} L${x + w},${y + h} Z`
  );
}

/** 오른쪽 두 모서리만 둥근 가로 막대. */
export function barPathRight(x: number, y: number, w: number, h: number, r = 4): string {
  if (w <= 0.5) return `M${x},${y} h0.5 v${h} h-0.5 Z`;
  const rr = Math.min(r, h / 2, w);
  return (
    `M${x},${y} L${x + w - rr},${y} Q${x + w},${y} ${x + w},${y + rr} ` +
    `L${x + w},${y + h - rr} Q${x + w},${y + h} ${x + w - rr},${y + h} L${x},${y + h} Z`
  );
}

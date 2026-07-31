import { format, subDays } from "date-fns";
import type { Session } from "../types/session";

export interface DailyPoint {
  date: string;
  label: string;
  pages: number;
  minutes: number;
}

export function buildDailySeries(sessions: Session[], days: number): DailyPoint[] {
  const totals = new Map<string, { pages: number; minutes: number }>();
  for (const s of sessions) {
    const prev = totals.get(s.log_date) ?? { pages: 0, minutes: 0 };
    totals.set(s.log_date, {
      pages: prev.pages + Math.max(0, s.pages),
      minutes: prev.minutes + (s.minutes ?? 0),
    });
  }
  const end = new Date();
  const out: DailyPoint[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = subDays(end, i);
    const key = format(d, "yyyy-MM-dd");
    const t = totals.get(key);
    out.push({ date: key, label: `${d.getMonth() + 1}/${d.getDate()}`, pages: t?.pages ?? 0, minutes: t?.minutes ?? 0 });
  }
  return out;
}

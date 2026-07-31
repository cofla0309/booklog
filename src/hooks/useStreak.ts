import { useCallback, useEffect, useState } from "react";
import { format, subDays } from "date-fns";
import { listAllSessionDates } from "../data/sessions";
import { getAppSettings } from "../data/settings";

interface DayTotals {
  pages: number;
  minutes: number;
}

function dayMeets(totals: DayTotals, pagesGoal: number | null, minutesGoal: number | null): boolean {
  const checks: boolean[] = [];
  if (pagesGoal != null) checks.push(totals.pages >= pagesGoal);
  if (minutesGoal != null) checks.push(totals.minutes >= minutesGoal);
  if (checks.length > 0) return checks.some(Boolean);
  return totals.pages > 0 || totals.minutes > 0;
}

function computeStreaks(
  rows: { log_date: string; pages: number; minutes: number | null }[],
  pagesGoal: number | null,
  minutesGoal: number | null,
): { current: number; longest: number } {
  const byDate = new Map<string, DayTotals>();
  for (const row of rows) {
    const prev = byDate.get(row.log_date) ?? { pages: 0, minutes: 0 };
    byDate.set(row.log_date, {
      pages: prev.pages + row.pages,
      minutes: prev.minutes + (row.minutes ?? 0),
    });
  }

  const metDays = new Set<string>();
  for (const [date, totals] of byDate) {
    if (dayMeets(totals, pagesGoal, minutesGoal)) metDays.add(date);
  }
  if (metDays.size === 0) return { current: 0, longest: 0 };

  let cursor = new Date();
  if (!metDays.has(format(cursor, "yyyy-MM-dd"))) {
    cursor = subDays(cursor, 1);
  }
  let current = 0;
  while (metDays.has(format(cursor, "yyyy-MM-dd"))) {
    current += 1;
    cursor = subDays(cursor, 1);
  }

  const ordered = [...metDays].sort();
  let longest = 1;
  let run = 1;
  for (let i = 1; i < ordered.length; i++) {
    const prevDate = new Date(ordered[i - 1]);
    const curDate = new Date(ordered[i]);
    const diffDays = Math.round((curDate.getTime() - prevDate.getTime()) / 86_400_000);
    run = diffDays === 1 ? run + 1 : 1;
    longest = Math.max(longest, run);
  }

  return { current, longest };
}

export function useStreak() {
  const [current, setCurrent] = useState(0);
  const [longest, setLongest] = useState(0);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(() => {
    setLoading(true);
    Promise.all([listAllSessionDates(), getAppSettings()])
      .then(([rows, settings]) => {
        const result = computeStreaks(rows, settings.pages_per_day, settings.minutes_per_day);
        setCurrent(result.current);
        setLongest(result.longest);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { current, longest, loading, refetch };
}

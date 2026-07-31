import { useCallback, useEffect, useState } from "react";
import { getDayOfYear, isLeapYear } from "date-fns";
import { getYearlyGoal } from "../data/settings";
import { countDoneBooksInYear } from "../data/books";
import type { YearlyGoal } from "../types/settings";

export interface YearlyProgress {
  year: number;
  done: number;
  target: number | null;
  daysElapsed: number;
  daysTotal: number;
  daysLeft: number;
  projected: number;
  pct: number | null;
  remaining: number | null;
  expectedByNow: number | null;
  ahead: number | null;
  onTrack: boolean | null;
  daysPerBook: number | null;
}

function computeProgress(year: number, done: number, goal: YearlyGoal | null): YearlyProgress {
  const now = new Date();
  const currentYear = now.getFullYear();
  const daysTotal = isLeapYear(new Date(year, 0, 1)) ? 366 : 365;
  const daysElapsed = year === currentYear ? getDayOfYear(now) : year < currentYear ? daysTotal : 0;
  const projected = daysElapsed > 0 ? Math.round((done / daysElapsed) * daysTotal) : 0;
  const target = goal?.target_books ?? null;

  const base: YearlyProgress = {
    year,
    done,
    target,
    daysElapsed,
    daysTotal,
    daysLeft: Math.max(0, daysTotal - daysElapsed),
    projected,
    pct: null,
    remaining: null,
    expectedByNow: null,
    ahead: null,
    onTrack: null,
    daysPerBook: null,
  };

  if (!target) return base;

  const pct = Math.round(Math.min(100, (done / target) * 100) * 10) / 10;
  const remaining = Math.max(0, target - done);
  const expectedByNow = Math.round((target * daysElapsed) / daysTotal * 10) / 10;
  const ahead = Math.round((done - expectedByNow) * 10) / 10;
  const onTrack = done >= expectedByNow;
  const daysPerBook = remaining > 0 && base.daysLeft > 0 ? Math.round((base.daysLeft / remaining) * 10) / 10 : null;

  return { ...base, pct, remaining, expectedByNow, ahead, onTrack, daysPerBook };
}

export function useYearlyGoal(year: number) {
  const [goal, setGoal] = useState<YearlyGoal | null>(null);
  const [doneCount, setDoneCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(() => {
    setLoading(true);
    Promise.all([getYearlyGoal(year), countDoneBooksInYear(year)])
      .then(([yearlyGoal, count]) => {
        setGoal(yearlyGoal);
        setDoneCount(count);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [year]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const progress = computeProgress(year, doneCount, goal);

  return { goal, doneCount, progress, loading, error, refetch };
}

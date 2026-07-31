import { useCallback, useEffect, useState } from "react";
import { format } from "date-fns";
import { getAppSettings } from "../data/settings";
import { listSessionsForRange } from "../data/sessions";
import type { AppSettings } from "../types/settings";

export function useDailyGoal() {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [pagesToday, setPagesToday] = useState(0);
  const [minutesToday, setMinutesToday] = useState(0);
  const [booksToday, setBooksToday] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(() => {
    setLoading(true);
    const today = format(new Date(), "yyyy-MM-dd");
    Promise.all([getAppSettings(), listSessionsForRange(today, today)])
      .then(([appSettings, sessions]) => {
        setSettings(appSettings);
        setPagesToday(sessions.reduce((sum, s) => sum + s.pages, 0));
        setMinutesToday(sessions.reduce((sum, s) => sum + (s.minutes ?? 0), 0));
        setBooksToday(new Set(sessions.map((s) => s.book_id)).size);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { settings, pagesToday, minutesToday, booksToday, loading, error, refetch };
}

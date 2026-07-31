import { useCallback, useEffect, useState } from "react";
import { listSessionsForBook } from "../data/sessions";
import type { Session } from "../types/session";

export function useSessions(bookId: string | undefined) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(() => {
    if (!bookId) return;
    setLoading(true);
    listSessionsForBook(bookId)
      .then(setSessions)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [bookId]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { sessions, loading, error, refetch };
}

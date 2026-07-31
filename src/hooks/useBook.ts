import { useCallback, useEffect, useState } from "react";
import { getBook } from "../data/books";
import type { DecoratedBook } from "../lib/bookDerived";

export function useBook(id: string | undefined) {
  const [book, setBook] = useState<DecoratedBook | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(() => {
    if (!id) return;
    setLoading(true);
    getBook(id)
      .then(setBook)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { book, loading, error, refetch };
}

import { useCallback, useEffect, useState } from "react";
import { listBooks, type ListBooksParams } from "../data/books";
import type { DecoratedBook } from "../lib/bookDerived";

export function useBooks(params: ListBooksParams) {
  const [books, setBooks] = useState<DecoratedBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { status, q, sort } = params;

  const refetch = useCallback(() => {
    setLoading(true);
    listBooks({ status, q, sort })
      .then(setBooks)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [status, q, sort]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { books, loading, error, refetch };
}

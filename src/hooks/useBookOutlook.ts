import { useEffect, useState } from "react";
import { getRecentSpeed } from "../data/sessions";
import { computeOutlook, type DeadlineOutlook } from "../lib/bookDerived";
import type { DecoratedBook } from "../lib/bookDerived";

export function useBookOutlook(book: DecoratedBook | null) {
  const [outlook, setOutlook] = useState<DeadlineOutlook>({ speed: null, eta: null, etaLate: null });

  useEffect(() => {
    if (!book) return;
    if (book.status === "done" || !book.hasTotal) {
      setOutlook({ speed: null, eta: null, etaLate: null });
      return;
    }
    getRecentSpeed(book.id).then((speed) => setOutlook(computeOutlook(book, speed)));
  }, [book]);

  return outlook;
}

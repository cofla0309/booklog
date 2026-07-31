import { addDays, differenceInCalendarDays, format } from "date-fns";
import type { Book, BookStatus } from "../types/book";

export const STATUS_LABELS: Record<BookStatus, string> = {
  wishlist: "읽고싶은",
  reading: "읽는 중",
  done: "완독",
  paused: "중단",
};

export interface DecoratedBook extends Book {
  statusLabel: string;
  hasTotal: boolean;
  progressPct: number | null;
  pagesLeft: number | null;
  dueDaysLeft: number | null;
  dueOverdue: boolean;
  duePagesPerDay: number | null;
}

export function decorateBook(book: Book): DecoratedBook {
  const total = book.total_pages ?? 0;
  const cur = book.current_page ?? 0;
  const hasTotal = total > 0;
  const progressPct = hasTotal
    ? Math.round(Math.min(100, Math.max(0, (cur / total) * 100)) * 10) / 10
    : null;
  const pagesLeft = hasTotal ? Math.max(0, total - cur) : null;

  const dueDaysLeft = book.due_date
    ? differenceInCalendarDays(new Date(book.due_date), new Date())
    : null;
  const dueOverdue = Boolean(
    book.due_date && dueDaysLeft !== null && dueDaysLeft < 0 && book.status !== "done",
  );

  let duePagesPerDay: number | null = null;
  if (book.due_date && pagesLeft !== null && book.status !== "done") {
    const days = dueDaysLeft !== null && dueDaysLeft > 0 ? dueDaysLeft : 1;
    duePagesPerDay = Math.ceil(pagesLeft / days);
  }

  return {
    ...book,
    statusLabel: STATUS_LABELS[book.status],
    hasTotal,
    progressPct,
    pagesLeft,
    dueDaysLeft,
    dueOverdue,
    duePagesPerDay,
  };
}

export interface DeadlineOutlook {
  speed: number | null;
  eta: string | null;
  etaLate: boolean | null;
}

/** speed: recent avg pages/day for this book (see data/sessions.getRecentSpeed). */
export function computeOutlook(book: DecoratedBook, speed: number): DeadlineOutlook {
  if (book.status === "done" || !book.hasTotal) {
    return { speed: null, eta: null, etaLate: null };
  }
  const roundedSpeed = Math.round(speed * 10) / 10;
  const left = book.pagesLeft ?? 0;
  if (speed > 0 && left > 0) {
    const etaDays = Math.ceil(left / speed);
    const eta = format(addDays(new Date(), etaDays), "yyyy-MM-dd");
    const etaLate = book.due_date ? eta > book.due_date : null;
    return { speed: roundedSpeed, eta, etaLate };
  }
  return { speed: roundedSpeed, eta: null, etaLate: null };
}

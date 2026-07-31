import type { Book } from "../types/book";
import type { Session } from "../types/session";

function inYear(dateStr: string | null, year: number): boolean {
  return Boolean(dateStr && dateStr.startsWith(String(year)));
}

export interface StatsSummary {
  booksDone: number;
  pagesFromBooks: number;
  avgRating: number | null;
  avgDaysToFinish: number | null;
  sessionPages: number;
  sessionMinutes: number;
  readingDays: number;
  avgPagesPerReadingDay: number;
  avgMinutesPerReadingDay: number;
}

export function computeSummary(books: Book[], sessions: Session[], year: number | null): StatsSummary {
  const doneBooks = books.filter((b) => b.status === "done" && (year == null || inYear(b.end_date, year)));
  const relevantSessions = year == null ? sessions : sessions.filter((s) => s.log_date.startsWith(String(year)));

  const ratings = doneBooks.map((b) => b.rating).filter((r): r is number => r != null);
  const daysToFinish = doneBooks
    .filter((b) => b.start_date && b.end_date)
    .map((b) => (new Date(b.end_date!).getTime() - new Date(b.start_date!).getTime()) / 86_400_000);

  const sessionPages = relevantSessions.reduce((sum, s) => sum + s.pages, 0);
  const sessionMinutes = relevantSessions.reduce((sum, s) => sum + (s.minutes ?? 0), 0);
  const readingDays = new Set(relevantSessions.map((s) => s.log_date)).size;

  return {
    booksDone: doneBooks.length,
    pagesFromBooks: doneBooks.reduce((sum, b) => sum + (b.total_pages ?? 0), 0),
    avgRating: ratings.length
      ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 100) / 100
      : null,
    avgDaysToFinish: daysToFinish.length
      ? Math.round((daysToFinish.reduce((a, b) => a + b, 0) / daysToFinish.length) * 10) / 10
      : null,
    sessionPages,
    sessionMinutes,
    readingDays,
    avgPagesPerReadingDay: readingDays ? Math.round(sessionPages / readingDays) : 0,
    avgMinutesPerReadingDay: readingDays ? Math.round(sessionMinutes / readingDays) : 0,
  };
}

const MONTH_LABELS = [
  "1월", "2월", "3월", "4월", "5월", "6월",
  "7월", "8월", "9월", "10월", "11월", "12월",
];

export interface MonthlyPoint {
  month: number;
  label: string;
  books: number;
  pages: number;
  minutes: number;
}

export function computeMonthly(books: Book[], sessions: Session[], year: number): MonthlyPoint[] {
  const doneByMonth = new Array(12).fill(0);
  for (const b of books) {
    if (b.status === "done" && inYear(b.end_date, year)) {
      doneByMonth[Number(b.end_date!.slice(5, 7)) - 1] += 1;
    }
  }
  const pagesByMonth = new Array(12).fill(0);
  const minutesByMonth = new Array(12).fill(0);
  for (const s of sessions) {
    if (s.log_date.startsWith(String(year))) {
      const m = Number(s.log_date.slice(5, 7)) - 1;
      pagesByMonth[m] += Math.max(0, s.pages);
      minutesByMonth[m] += s.minutes ?? 0;
    }
  }
  return MONTH_LABELS.map((label, i) => ({
    month: i + 1,
    label,
    books: doneByMonth[i],
    pages: pagesByMonth[i],
    minutes: minutesByMonth[i],
  }));
}

export interface CategoryPoint {
  name: string;
  books: number;
  pages: number;
}

export function computeByCategory(books: Book[], year: number | null): CategoryPoint[] {
  const doneBooks = books.filter((b) => b.status === "done" && (year == null || inYear(b.end_date, year)));
  const map = new Map<string, CategoryPoint>();
  for (const b of doneBooks) {
    const name = b.category || "미분류";
    const prev = map.get(name) ?? { name, books: 0, pages: 0 };
    map.set(name, { name, books: prev.books + 1, pages: prev.pages + (b.total_pages ?? 0) });
  }
  return [...map.values()].sort((a, b) => b.books - a.books || a.name.localeCompare(b.name));
}

export function computeRatingDistribution(
  books: Book[],
  year: number | null,
): { rating: number; books: number }[] {
  const doneBooks = books.filter(
    (b) => b.status === "done" && b.rating != null && (year == null || inYear(b.end_date, year)),
  );
  return [1, 2, 3, 4, 5].map((rating) => ({
    rating,
    books: doneBooks.filter((b) => b.rating === rating).length,
  }));
}

export function computeHeatmapValues(sessions: Session[], year: number): Record<string, number> {
  const out: Record<string, number> = {};
  for (const s of sessions) {
    if (!s.log_date.startsWith(String(year))) continue;
    out[s.log_date] = (out[s.log_date] ?? 0) + Math.max(0, s.pages);
  }
  return out;
}

export function availableYears(books: Book[], sessions: Session[]): number[] {
  const years = new Set<number>();
  years.add(new Date().getFullYear());
  for (const b of books) if (b.end_date) years.add(Number(b.end_date.slice(0, 4)));
  for (const s of sessions) years.add(Number(s.log_date.slice(0, 4)));
  return [...years].sort((a, b) => b - a);
}

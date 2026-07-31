import { eachDayOfInterval, endOfMonth, format, getDay, startOfMonth } from "date-fns";
import { Link } from "react-router";
import type { Book } from "../../types/book";

const WEEKDAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];

interface CompletionCalendarProps {
  books: Book[];
}

export function CompletionCalendar({ books }: CompletionCalendarProps) {
  const now = new Date();
  const start = startOfMonth(now);
  const end = endOfMonth(now);
  const days = eachDayOfInterval({ start, end });
  const leadingBlanks = getDay(start);

  const byDate = new Map<string, Book[]>();
  for (const book of books) {
    if (book.status !== "done" || !book.end_date) continue;
    const list = byDate.get(book.end_date) ?? [];
    list.push(book);
    byDate.set(book.end_date, list);
  }

  return (
    <div className="card">
      <div className="card-head">
        <h2>
          {now.getFullYear()}년 {now.getMonth() + 1}월 완독 캘린더
        </h2>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "4px" }}>
        {WEEKDAY_LABELS.map((label) => (
          <div key={label} className="tiny dim center">
            {label}
          </div>
        ))}
        {Array.from({ length: leadingBlanks }).map((_, i) => (
          <div key={`blank-${i}`} />
        ))}
        {days.map((day) => {
          const key = format(day, "yyyy-MM-dd");
          const finished = byDate.get(key) ?? [];
          return (
            <div
              key={key}
              style={{
                minHeight: 76,
                border: "1px solid var(--grid)",
                borderRadius: 6,
                padding: 4,
                display: "flex",
                flexDirection: "column",
                gap: 4,
              }}
            >
              <span className="tiny dim">{day.getDate()}</span>
              {finished.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
                  {finished.map((book) =>
                    book.cover_url ? (
                      <Link key={book.id} to={`/books/${book.id}`} title={book.title}>
                        <img
                          src={book.cover_url}
                          alt={book.title}
                          className="cover"
                          style={{ width: 28 }}
                        />
                      </Link>
                    ) : (
                      <Link
                        key={book.id}
                        to={`/books/${book.id}`}
                        title={book.title}
                        className="cover cover-ph"
                        style={{ width: 28, fontSize: "0.7rem" }}
                      >
                        📕
                      </Link>
                    ),
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
      <p className="tiny dim" style={{ margin: ".6rem 0 0" }}>
        완독한 날짜에 책 표지가 표시됩니다. 표지는 책 추가 시 알라딘 검색으로 자동으로 채워집니다.
      </p>
    </div>
  );
}

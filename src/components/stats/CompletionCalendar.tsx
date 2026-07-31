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
  let monthCount = 0;
  for (const book of books) {
    if (book.status !== "done" || !book.end_date) continue;
    if (book.end_date < format(start, "yyyy-MM-dd") || book.end_date > format(end, "yyyy-MM-dd")) continue;
    const list = byDate.get(book.end_date) ?? [];
    list.push(book);
    byDate.set(book.end_date, list);
    monthCount += 1;
  }

  return (
    <div className="card">
      <div className="card-head">
        <h2>
          {now.getFullYear()}년 {now.getMonth() + 1}월 ({monthCount}권)
        </h2>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(0, 1fr))", gap: "3px" }}>
        {WEEKDAY_LABELS.map((label) => (
          <div key={label} className="tiny dim center" style={{ fontSize: "0.65rem" }}>
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
                minWidth: 0,
                aspectRatio: "3 / 4",
                border: "1px solid var(--grid)",
                borderRadius: 4,
                padding: 2,
                display: "flex",
                flexDirection: "column",
                gap: 2,
                overflow: "hidden",
              }}
            >
              <span className="tiny dim" style={{ fontSize: "0.65rem", lineHeight: 1, flex: "none" }}>
                {day.getDate()}
              </span>
              {finished.length > 0 && (
                <div style={{ display: "flex", gap: 2, minWidth: 0, flex: "1 1 0", minHeight: 0 }}>
                  {finished.map((book) =>
                    book.cover_url ? (
                      <Link
                        key={book.id}
                        to={`/books/${book.id}`}
                        title={book.title}
                        style={{ flex: "1 1 0", minWidth: 0, minHeight: 0 }}
                      >
                        <img
                          src={book.cover_url}
                          alt={book.title}
                          className="cover"
                          style={{ width: "100%", height: "100%", aspectRatio: "auto" }}
                        />
                      </Link>
                    ) : (
                      <Link
                        key={book.id}
                        to={`/books/${book.id}`}
                        title={book.title}
                        className="cover cover-ph"
                        style={{ flex: "1 1 0", minWidth: 0, width: "100%", height: "100%", aspectRatio: "auto", fontSize: "0.6rem" }}
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

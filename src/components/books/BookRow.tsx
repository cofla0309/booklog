import { Link } from "react-router";
import { fmt } from "../../lib/svgChartHelpers";
import { StatusBadge } from "./StatusBadge";
import type { DecoratedBook } from "../../lib/bookDerived";

interface BookRowProps {
  book: DecoratedBook;
  onStartReading: (bookId: string) => void;
}

export function BookRow({ book, onStartReading }: BookRowProps) {
  return (
    <div className="book-row">
      {book.cover_url ? (
        <img className="cover" src={book.cover_url} alt="" loading="lazy" />
      ) : (
        <div className="cover cover-ph">📕</div>
      )}

      <div className="body">
        <div style={{ display: "flex", gap: ".5rem", alignItems: "baseline" }}>
          <Link className="book-title" to={`/books/${book.id}`}>
            {book.title}
          </Link>
          <StatusBadge status={book.status} overdue={book.dueOverdue} />
        </div>
        <div className="tiny dim">
          {book.author || "저자 미상"}
          {book.publisher && ` · ${book.publisher}`}
          {book.category && ` · ${book.category}`}
        </div>

        {book.status === "done" ? (
          <>
            <div className="tiny" style={{ marginTop: ".3rem" }}>
              {book.rating && (
                <span className="rating-static">
                  {"★".repeat(book.rating)}
                  {"☆".repeat(5 - book.rating)}
                </span>
              )}
              <span className="dim">
                {book.end_date && `${book.end_date} 완독`}
                {book.total_pages && ` · ${fmt(book.total_pages)}p`}
              </span>
            </div>
            {book.memo && <div className="tiny dim" style={{ marginTop: ".2rem" }}>"{book.memo}"</div>}
          </>
        ) : book.status === "wishlist" ? (
          <div className="tiny dim" style={{ marginTop: ".3rem" }}>
            {book.total_pages ? `${fmt(book.total_pages)}p · ` : ""}아직 시작 전
          </div>
        ) : book.hasTotal ? (
          <>
            <div
              className={`meter${book.dueOverdue ? " late" : ""}`}
              style={{ marginTop: ".4rem", maxWidth: 340 }}
            >
              <span style={{ width: `${book.progressPct}%` }} />
            </div>
            <div className="tiny dim num" style={{ marginTop: ".25rem" }}>
              {fmt(book.current_page)} / {fmt(book.total_pages ?? 0)}p · {book.progressPct}%
              {book.due_date &&
                (book.dueOverdue ? (
                  <>
                    {" "}
                    · <span className="bad">마감 {Math.abs(book.dueDaysLeft ?? 0)}일 지남</span>
                  </>
                ) : (
                  <> · 마감 {book.dueDaysLeft}일 전</>
                ))}
            </div>
          </>
        ) : (
          <div className="tiny dim" style={{ marginTop: ".3rem" }}>
            {fmt(book.current_page)}p 읽음 · 총 페이지 미입력
          </div>
        )}
      </div>

      <div className="nowrap" style={{ display: "flex", gap: ".3rem", flex: "none" }}>
        {book.status === "wishlist" && (
          <button type="button" className="btn-sm" onClick={() => onStartReading(book.id)}>
            읽기 시작
          </button>
        )}
        <Link className="btn btn-sm" to={`/books/${book.id}`}>
          열기
        </Link>
      </div>
    </div>
  );
}

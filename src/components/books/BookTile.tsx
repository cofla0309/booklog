import { Link } from "react-router";
import { fmt } from "../../lib/svgChartHelpers";
import { useBookOutlook } from "../../hooks/useBookOutlook";
import { ProgressForm } from "./ProgressForm";
import type { DecoratedBook } from "../../lib/bookDerived";
import type { Book } from "../../types/book";

interface BookTileProps {
  book: DecoratedBook;
  onLogged: (updated: Book, completionSuggested: boolean) => void;
}

export function BookTile({ book, onLogged }: BookTileProps) {
  const outlook = useBookOutlook(book);

  return (
    <div className="book-tile">
      {book.cover_url ? (
        <img className="cover" src={book.cover_url} alt="" loading="lazy" />
      ) : (
        <div className="cover cover-ph">📕</div>
      )}
      <div className="body">
        <Link className="book-title" to={`/books/${book.id}`} title={book.title}>
          {book.title}
        </Link>
        <div className="tiny dim" style={{ marginBottom: ".45rem" }}>
          {book.author || "저자 미상"}
        </div>

        {book.hasTotal ? (
          <>
            <div className={`meter${book.dueOverdue ? " late" : ""}`}>
              <span style={{ width: `${book.progressPct}%` }} />
            </div>
            <div className="tiny dim" style={{ display: "flex", gap: ".4rem", marginTop: ".3rem" }}>
              <span className="num">
                {fmt(book.current_page)} / {fmt(book.total_pages ?? 0)}p
              </span>
              <span className="num">{book.progressPct}%</span>
            </div>
          </>
        ) : (
          <div className="tiny dim">
            <span className="num">{fmt(book.current_page)}</span>p 읽음 ·{" "}
            <Link to={`/books/${book.id}`}>총 페이지 입력</Link>
          </div>
        )}

        {book.due_date ? (
          <div className="tiny" style={{ marginTop: ".35rem" }}>
            {book.dueOverdue ? (
              <span className="badge late">마감 {Math.abs(book.dueDaysLeft ?? 0)}일 지남</span>
            ) : book.duePagesPerDay ? (
              <span className="dim">
                마감까지 {book.dueDaysLeft}일 · 하루 <span className="strong">{book.duePagesPerDay}p</span> 필요
              </span>
            ) : (
              <span className="dim">마감 {book.due_date}</span>
            )}
            {outlook.eta && (
              <div className="dim" style={{ marginTop: ".15rem" }}>
                지금 속도({outlook.speed}p/일)면{" "}
                <span className={outlook.etaLate ? "bad" : "good"}>{outlook.eta}</span> 완독 예상
              </div>
            )}
          </div>
        ) : (
          outlook.eta && (
            <div className="tiny dim" style={{ marginTop: ".35rem" }}>
              지금 속도({outlook.speed}p/일)면 {outlook.eta} 완독 예상
            </div>
          )
        )}

        <ProgressForm book={book} showMinutes stacked onLogged={onLogged} />
      </div>
    </div>
  );
}

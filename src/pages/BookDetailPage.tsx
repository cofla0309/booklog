import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { Link } from "react-router";
import { useBook } from "../hooks/useBook";
import { useSessions } from "../hooks/useSessions";
import { useBookOutlook } from "../hooks/useBookOutlook";
import { StatusBadge } from "../components/books/StatusBadge";
import { Stars } from "../components/ui/Stars";
import { ProgressForm } from "../components/books/ProgressForm";
import { SessionTable } from "../components/books/SessionTable";
import { LineChart } from "../components/charts/LineChart";
import { FinishBookModal } from "../components/books/FinishBookModal";
import { updateBook, deleteBook, setStatus, listCategories } from "../data/books";
import { getBookProgressSeries } from "../data/sessions";
import { fmt } from "../lib/svgChartHelpers";
import type { BookStatus } from "../types/book";

export function BookDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { book, loading, refetch } = useBook(id);
  const { sessions, refetch: refetchSessions } = useSessions(id);
  const outlook = useBookOutlook(book);
  const [series, setSeries] = useState<{ date: string; page: number }[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [finishing, setFinishing] = useState(false);

  const [category, setCategory] = useState("");
  const [totalPages, setTotalPages] = useState("");
  const [startDate, setStartDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [finishedOn, setFinishedOn] = useState("");
  const [memo, setMemo] = useState("");
  const [author, setAuthor] = useState("");
  const [publisher, setPublisher] = useState("");
  const [syncedId, setSyncedId] = useState<string | null>(null);

  useEffect(() => {
    if (id) getBookProgressSeries(id).then(setSeries);
    listCategories().then(setCategories);
  }, [id, sessions]);

  useEffect(() => {
    if (!book || syncedId === book.id) return;
    setCategory(book.category ?? "");
    setTotalPages(book.total_pages ? String(book.total_pages) : "");
    setStartDate(book.start_date ?? "");
    setDueDate(book.due_date ?? "");
    setFinishedOn(book.end_date ?? "");
    setMemo(book.memo ?? "");
    setAuthor(book.author ?? "");
    setPublisher(book.publisher ?? "");
    setSyncedId(book.id);
  }, [book, syncedId]);

  if (loading || !book) {
    return <p className="tiny dim">불러오는 중...</p>;
  }

  async function save(patch: Parameters<typeof updateBook>[1]) {
    if (!id) return;
    await updateBook(id, patch);
    refetch();
  }

  async function handleSetStatus(next: BookStatus) {
    if (!id || !book) return;
    await setStatus(id, next, book);
    refetch();
  }

  async function handleDelete() {
    if (!id || !book) return;
    if (!confirm(`"${book.title}"을(를) 삭제할까요? 기록도 함께 삭제됩니다.`)) return;
    await deleteBook(id);
    navigate(`/books?status=${book.status}`);
  }

  return (
    <div>
      <div className="page-head">
        <Link className="tiny dim" to={`/books?status=${book.status}`} style={{ textDecoration: "none" }}>
          ← 서재
        </Link>
        <span className="spacer" />
        {book.status !== "reading" && (
          <button type="button" className="btn-sm" onClick={() => handleSetStatus("reading")}>
            읽는 중으로
          </button>
        )}
        {book.status !== "done" && (
          <button type="button" className="btn-sm" onClick={() => handleSetStatus("done")}>
            완독 처리
          </button>
        )}
        {book.status !== "paused" && book.status !== "done" && (
          <button type="button" className="btn-sm" onClick={() => handleSetStatus("paused")}>
            중단
          </button>
        )}
        <button type="button" className="btn-sm btn-danger" onClick={handleDelete}>
          삭제
        </button>
      </div>

      <div className="card">
        <div style={{ display: "flex", gap: "1.1rem", flexWrap: "wrap" }}>
          {book.cover_url ? (
            <img className="cover lg" src={book.cover_url} alt="" />
          ) : (
            <div className="cover lg cover-ph">📕</div>
          )}

          <div style={{ flex: 1, minWidth: 230 }}>
            <div style={{ display: "flex", gap: ".5rem", alignItems: "baseline", flexWrap: "wrap" }}>
              <h1 style={{ fontSize: "1.25rem" }}>{book.title}</h1>
              <StatusBadge status={book.status} overdue={book.dueOverdue} />
            </div>
            <div className="sub" style={{ margin: ".2rem 0 .1rem" }}>
              {book.author || "저자 미상"}
            </div>
            <div className="tiny dim">
              {book.publisher || ""}
              {book.category && ` · ${book.category}`}
              {book.isbn && ` · ISBN ${book.isbn}`}
            </div>

            <div style={{ marginTop: ".7rem" }}>
              <span className="label">별점</span>
              <div>
                <Stars value={book.rating ?? 0} onChange={(rating) => save({ rating })} />
              </div>
            </div>

            {book.hasTotal ? (
              <>
                <div
                  className={`meter thick${book.dueOverdue ? " late" : ""}${book.status === "done" ? " done" : ""}`}
                  style={{ marginTop: ".8rem" }}
                >
                  <span style={{ width: `${book.progressPct}%` }} />
                </div>
                <div className="sub num" style={{ marginTop: ".35rem" }}>
                  {fmt(book.current_page)} / {fmt(book.total_pages ?? 0)}p · {book.progressPct}% ·{" "}
                  {fmt(book.pagesLeft ?? 0)}p 남음
                </div>
              </>
            ) : (
              <p className="notice warn" style={{ marginTop: ".8rem" }}>
                총 페이지가 없어 진도율을 계산할 수 없습니다. 아래 "책 정보"에 입력해 주세요.
              </p>
            )}

            {book.status !== "done" && (
              <>
                <ProgressForm
                  book={book}
                  showMinutes
                  onLogged={(_updated, completionSuggested) => {
                    refetch();
                    refetchSessions();
                    if (completionSuggested) setFinishing(true);
                  }}
                />
                <p className="tiny dim" style={{ margin: ".35rem 0 0" }}>
                  같은 날 여러 번 기록해도 그날 기록 한 줄로 합쳐집니다. 시간은 선택 입력입니다.
                </p>
              </>
            )}
          </div>
        </div>

        {book.due_date && book.status !== "done" && (
          <div
            className="grid grid-3"
            style={{ borderTop: "1px solid var(--grid)", marginTop: "1rem", paddingTop: ".8rem" }}
          >
            <div>
              <div className="label">마감까지</div>
              <div className="strong">
                {book.dueOverdue ? (
                  <span className="bad">{Math.abs(book.dueDaysLeft ?? 0)}일 지남</span>
                ) : (
                  `${book.dueDaysLeft}일`
                )}
              </div>
            </div>
            <div>
              <div className="label">하루 필요</div>
              <div className="strong num">{book.duePagesPerDay ? `${book.duePagesPerDay}p` : "–"}</div>
            </div>
            <div>
              <div className="label">지금 속도 / 예상</div>
              <div className="strong num">
                {outlook.speed ? `${outlook.speed}p/일` : "–"}
                {outlook.eta && (
                  <span className={outlook.etaLate ? "bad" : "good"} style={{ fontWeight: 500 }}>
                    {" "}
                    → {outlook.eta}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-hero">
        <div className="card">
          <div className="card-head">
            <h2>진도</h2>
            <span className="tiny dim">기록한 날의 도달 페이지</span>
          </div>
          <LineChart
            points={series.map((p) => ({ x: p.date, y: p.page }))}
            total={book.total_pages}
            unit="p"
          />
        </div>

        <div className="card">
          <div className="card-head">
            <h2>책 정보</h2>
            <span className="tiny dim">고치면 바로 저장됩니다</span>
          </div>

          <div className="field-row">
            <div className="field">
              <label htmlFor="e-pages">총 페이지</label>
              <input
                id="e-pages"
                type="number"
                min={1}
                max={100000}
                value={totalPages}
                onChange={(e) => setTotalPages(e.target.value)}
                onBlur={() => save({ total_pages: totalPages ? Number(totalPages) : null })}
              />
            </div>
            <div className="field">
              <label htmlFor="e-cat">카테고리</label>
              <input
                id="e-cat"
                list="category-list"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                onBlur={() => save({ category: category || null })}
              />
              <datalist id="category-list">
                {categories.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </div>
          </div>
          <div className="field-row">
            <div className="field">
              <label htmlFor="e-start">시작일</label>
              <input
                id="e-start"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                onBlur={() => save({ start_date: startDate || null })}
              />
            </div>
            <div className="field">
              <label htmlFor="e-due">마감일 목표</label>
              <input
                id="e-due"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                onBlur={() => save({ due_date: dueDate || null })}
              />
            </div>
          </div>
          {book.status === "done" && (
            <div className="field">
              <label htmlFor="e-fin">완독일</label>
              <input
                id="e-fin"
                type="date"
                value={finishedOn}
                onChange={(e) => setFinishedOn(e.target.value)}
                onBlur={() => save({ end_date: finishedOn || null })}
              />
            </div>
          )}
          <div className="field">
            <label htmlFor="e-memo">메모 · 한줄평</label>
            <textarea
              id="e-memo"
              placeholder="읽으면서 남기고 싶은 것"
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              onBlur={() => save({ memo: memo || null })}
            />
          </div>
          <div className="field-row">
            <div className="field">
              <label htmlFor="e-author">저자</label>
              <input
                id="e-author"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                onBlur={() => save({ author: author || null })}
              />
            </div>
            <div className="field">
              <label htmlFor="e-pub">출판사</label>
              <input
                id="e-pub"
                value={publisher}
                onChange={(e) => setPublisher(e.target.value)}
                onBlur={() => save({ publisher: publisher || null })}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-head">
          <h2>날짜별 기록</h2>
          <span className="tiny dim">{sessions.length}일</span>
        </div>
        <SessionTable
          bookId={id ?? ""}
          sessions={sessions}
          onChanged={() => {
            refetch();
            refetchSessions();
          }}
        />
        {sessions.length === 0 && book.status === "done" && (
          <p className="tiny dim">완독으로만 등록된 책이라 일일 통계에는 잡히지 않습니다.</p>
        )}
      </div>

      <FinishBookModal
        book={finishing ? book : null}
        onClose={() => setFinishing(false)}
        onFinished={() => {
          refetch();
          refetchSessions();
        }}
      />
    </div>
  );
}

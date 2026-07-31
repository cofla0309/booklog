import { useEffect, useState } from "react";
import { useSearchParams } from "react-router";
import { BookRow } from "../components/books/BookRow";
import { AddBookModal } from "../components/books/AddBookModal";
import { useBooks } from "../hooks/useBooks";
import { statusCounts, updateBook } from "../data/books";
import { STATUS_LABELS } from "../lib/bookDerived";
import type { BookSort } from "../data/books";
import type { BookStatus } from "../types/book";

const chipOrder: (BookStatus | "all")[] = ["reading", "done", "wishlist", "paused", "all"];

export function BooksPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const status = (searchParams.get("status") as BookStatus | "all") || "all";
  const sort = (searchParams.get("sort") as BookSort) || "recent";
  const q = searchParams.get("q") ?? "";
  const [qInput, setQInput] = useState(q);
  const [counts, setCounts] = useState<Record<BookStatus | "all", number>>({
    wishlist: 0,
    reading: 0,
    done: 0,
    paused: 0,
    all: 0,
  });
  const [addOpen, setAddOpen] = useState(false);

  const { books, loading, refetch } = useBooks({ status, q, sort });

  useEffect(() => {
    statusCounts().then(setCounts);
  }, [books]);

  function updateParams(next: Record<string, string>) {
    const params: Record<string, string> = { status, sort };
    if (q) params.q = q;
    Object.assign(params, next);
    if (!params.q) delete params.q;
    setSearchParams(params);
  }

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    updateParams({ q: qInput });
  }

  async function handleStartReading(bookId: string) {
    await updateBook(bookId, { status: "reading" });
    refetch();
  }

  return (
    <div>
      <div className="page-head">
        <h1>서재</h1>
        <span className="spacer" />
        <button type="button" className="primary" onClick={() => setAddOpen(true)}>
          + 책 추가
        </button>
      </div>

      <div className="card">
        <div className="chips" style={{ marginBottom: ".9rem" }}>
          {chipOrder.map((key) => (
            <button
              key={key}
              type="button"
              className={`chip${status === key ? " on" : ""}`}
              onClick={() => updateParams({ status: key })}
            >
              {key === "all" ? "전체" : STATUS_LABELS[key]}
              <span className="count">{counts[key]}</span>
            </button>
          ))}
        </div>

        <form onSubmit={handleSearchSubmit} className="field-row" style={{ marginBottom: "1rem" }}>
          <input
            type="search"
            placeholder="제목 · 저자 · 출판사 검색"
            value={qInput}
            onChange={(e) => setQInput(e.target.value)}
          />
          <select
            value={sort}
            onChange={(e) => updateParams({ sort: e.target.value })}
            style={{ flex: "none", width: "auto", minWidth: 130 }}
          >
            <option value="recent">최근 순</option>
            <option value="title">제목 순</option>
            <option value="author">저자 순</option>
            <option value="progress">진도 순</option>
            <option value="rating">별점 순</option>
            <option value="finished">완독일 순</option>
          </select>
          <button type="submit" style={{ flex: "none" }}>
            검색
          </button>
        </form>

        {loading ? (
          <p className="tiny dim">불러오는 중...</p>
        ) : books.length > 0 ? (
          books.map((book) => <BookRow key={book.id} book={book} onStartReading={handleStartReading} />)
        ) : (
          <div className="empty-state">
            <div className="big">🔍</div>
            {q ? (
              <>
                <p>"{q}" 에 맞는 책이 없습니다.</p>
                <button type="button" className="btn" onClick={() => updateParams({ q: "" })}>
                  검색 지우기
                </button>
              </>
            ) : (
              <>
                <p>{status === "all" ? "전체" : STATUS_LABELS[status]} 칸이 비어 있습니다.</p>
                <button type="button" className="primary" onClick={() => setAddOpen(true)}>
                  + 책 추가
                </button>
              </>
            )}
          </div>
        )}
      </div>

      <AddBookModal open={addOpen} onClose={() => setAddOpen(false)} onCreated={() => refetch()} />
    </div>
  );
}
